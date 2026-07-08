import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query, queryOne, insert, update } from '../config/mysql';
import { sendSuccess } from '../utils/response';

const toInt = (value: unknown) => Number.parseInt(String(value), 10);

const isFutureDate = (value: string | Date) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
};

const generateTransactionReferenceId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY-${timestamp}-${random}`;
};

export const contributeToDonation = async (req: AuthRequest, res: Response) => {
  const donationId = toInt(req.params.id);
  const donorId = toInt(req.user!.id);

  const {
    pickupScheduledDateTime,
    donorAddress,
    donorContactNumber,
    notes,
    amount,
    donorProvidedReference,
  } = req.body;

  if (!donationId) {
    return res.status(400).json({ success: false, message: 'Invalid donation id' });
  }

  const donation = await queryOne<any>(
    `SELECT d.*, p.qr_code_image, p.bank_account_number, p.bank_name, p.ifsc_code, p.account_holder_name
     FROM donations d
     LEFT JOIN donation_payment_details p ON d.id = p.donation_id
     WHERE d.id = ?`,
    [donationId]
  );

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  if (['CANCELLED', 'COMPLETED'].includes(donation.status)) {
    return res.status(400).json({ success: false, message: `Cannot contribute to ${String(donation.status).toLowerCase()} donation` });
  }

  const category = donation.donation_category || donation.donation_type;

  if (category === 'MONEY' || category === 'FUNDS') {
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount is required and must be greater than 0' });
    }

    if (!donation.qr_code_image || !donation.bank_account_number || !donation.bank_name || !donation.ifsc_code || !donation.account_holder_name) {
      return res.status(400).json({ success: false, message: 'Payment details incomplete. QR code and bank details are required.' });
    }

    const existingPayment = await queryOne<any>(
      'SELECT id FROM payments WHERE donation_id = ? AND donor_id = ?',
      [donationId, donorId]
    );

    if (existingPayment) {
      return res.status(409).json({ success: false, message: 'You have already submitted a payment for this donation' });
    }

    let transactionReferenceId = generateTransactionReferenceId();

    for (;;) {
      const exists = await queryOne<any>('SELECT id FROM payments WHERE transaction_reference_id = ?', [transactionReferenceId]);
      if (!exists) break;
      transactionReferenceId = generateTransactionReferenceId();
    }

    const paymentId = await insert(
      `INSERT INTO payments 
       (donation_id, donor_id, ngo_id, amount, transaction_reference_id, donor_provided_reference, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [donationId, donorId, donation.ngo_id, Number(amount), transactionReferenceId, donorProvidedReference?.trim() || null]
    );

    const payment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [paymentId]);

    return sendSuccess(res, {
      ...payment,
      paymentDetails: {
        qrCodeImage: donation.qr_code_image,
        bankAccountNumber: donation.bank_account_number,
        bankName: donation.bank_name,
        ifscCode: donation.ifsc_code,
        accountHolderName: donation.account_holder_name,
      },
    }, 'Payment submitted successfully. Please complete payment externally and confirm.', 201);
  }

  if (!pickupScheduledDateTime || !donorAddress || !donorContactNumber) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: pickupScheduledDateTime, donorAddress, donorContactNumber',
    });
  }

  if (!isFutureDate(pickupScheduledDateTime)) {
    return res.status(400).json({ success: false, message: 'Pickup date must be in the future' });
  }

  const existingContribution = await queryOne<any>(
    'SELECT id FROM contributions WHERE donation_id = ? AND donor_id = ?',
    [donationId, donorId]
  );

  if (existingContribution) {
    return res.status(409).json({ success: false, message: 'You have already contributed to this donation' });
  }

  const donor = await queryOne<any>('SELECT * FROM donors WHERE id = ?', [donorId]);

  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  if (!donor.full_address || !donor.phone_number) {
    await update(
      `UPDATE donors SET 
       full_address = COALESCE(NULLIF(full_address, ''), ?),
       phone_number = COALESCE(NULLIF(phone_number, ''), ?)
       WHERE id = ?`,
      [donorAddress.trim(), donorContactNumber.trim(), donorId]
    );
  }

  const contributionId = await insert(
    `INSERT INTO contributions 
     (donation_id, donor_id, notes, scheduled_pickup_time, pickup_scheduled_date_time, donor_address, donor_contact_number, pickup_status, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', 'PENDING')`,
    [
      donationId,
      donorId,
      notes?.trim() || null,
      new Date(pickupScheduledDateTime),
      new Date(pickupScheduledDateTime),
      donorAddress.trim(),
      donorContactNumber.trim(),
    ]
  );

  const contribution = await queryOne<any>('SELECT * FROM contributions WHERE id = ?', [contributionId]);

  return sendSuccess(res, contribution, 'Contribution submitted successfully', 201);
};

export const getNgoPickups = async (req: AuthRequest, res: Response) => {
  const ngoId = toInt(req.user!.id);
  const { pickupStatus, donationId } = req.query;

  let sql = `
    SELECT c.*, d.name AS donor_name, d.email AS donor_email,
           dn.purpose, dn.donation_category, dn.donation_type, dn.quantity_or_amount, dn.location_address
    FROM contributions c
    JOIN donors d ON c.donor_id = d.id
    JOIN donations dn ON c.donation_id = dn.id
    WHERE dn.ngo_id = ?
  `;
  const params: any[] = [ngoId];

  if (pickupStatus) {
    sql += ' AND c.pickup_status = ?';
    params.push(pickupStatus);
  }

  if (donationId) {
    sql += ' AND c.donation_id = ?';
    params.push(toInt(donationId));
  }

  sql += ' ORDER BY c.pickup_scheduled_date_time ASC';

  const pickups = await query<any>(sql, params);

  return sendSuccess(res, { count: pickups.length, pickups }, 'Pickups fetched successfully');
};

export const updatePickupStatus = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const ngoId = toInt(req.user!.id);
  const { pickupStatus } = req.body;

  if (!['SCHEDULED', 'PICKED_UP', 'CANCELLED'].includes(pickupStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid pickup status. Must be SCHEDULED, PICKED_UP, or CANCELLED' });
  }

  const contribution = await queryOne<any>(
    `SELECT c.*, dn.ngo_id
     FROM contributions c
     JOIN donations dn ON c.donation_id = dn.id
     WHERE c.id = ?`,
    [id]
  );

  if (!contribution) {
    return res.status(404).json({ success: false, message: 'Pickup not found' });
  }

  if (Number(contribution.ngo_id) !== ngoId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await update(
    'UPDATE contributions SET pickup_status = ?, status = ? WHERE id = ?',
    [pickupStatus, pickupStatus === 'PICKED_UP' ? 'COMPLETED' : contribution.status, id]
  );

  const updatedPickup = await queryOne<any>('SELECT * FROM contributions WHERE id = ?', [id]);

  return sendSuccess(res, updatedPickup, 'Pickup status updated successfully');
};