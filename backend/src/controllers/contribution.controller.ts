import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query, queryOne, insert, update } from '../config/mysql';
import { sendSuccess } from '../utils/response';

const toInt = (value: unknown) => Number.parseInt(String(value), 10);

const isFutureDate = (value: string | Date) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
};

export const createContribution = async (req: AuthRequest, res: Response) => {
  const donorId = toInt(req.user!.id);
  const { donationId, notes, scheduledPickupTime } = req.body;

  const donationIdNum = toInt(donationId);

  if (!donationIdNum || !scheduledPickupTime) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (!isFutureDate(scheduledPickupTime)) {
    return res.status(400).json({ success: false, message: 'Scheduled pickup must be in the future' });
  }

  const donation = await queryOne<any>('SELECT * FROM donations WHERE id = ?', [donationIdNum]);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  const existing = await queryOne<any>(
    'SELECT id FROM contributions WHERE donation_id = ? AND donor_id = ?',
    [donationIdNum, donorId]
  );

  if (existing) {
    return res.status(409).json({ success: false, message: 'You have already contributed to this donation' });
  }

  const donor = await queryOne<any>('SELECT * FROM donors WHERE id = ?', [donorId]);

  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  const contributionId = await insert(
    `INSERT INTO contributions 
      (donation_id, donor_id, notes, scheduled_pickup_time, pickup_scheduled_date_time, donor_address, donor_contact_number, pickup_status, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', 'PENDING')`,
    [
      donationIdNum,
      donorId,
      notes || null,
      new Date(scheduledPickupTime),
      new Date(scheduledPickupTime),
      donor.full_address || 'N/A',
      donor.phone_number || donor.contact_info || 'N/A',
    ]
  );

  const contribution = await queryOne<any>(
    `SELECT c.*, d.name AS donor_name, d.email AS donor_email, dn.purpose, dn.description, dn.quantity_or_amount
     FROM contributions c
     JOIN donors d ON c.donor_id = d.id
     JOIN donations dn ON c.donation_id = dn.id
     WHERE c.id = ?`,
    [contributionId]
  );

  return sendSuccess(res, contribution, 'Contribution created', 201);
};

export const getMyContributions = async (req: AuthRequest, res: Response) => {
  const donorId = toInt(req.user!.id);

  const contributions = await query<any>(
    `SELECT c.*, dn.purpose, dn.description, dn.donation_category, dn.donation_type, dn.quantity_or_amount,
            u.name AS ngo_name, u.email AS ngo_email
     FROM contributions c
     JOIN donations dn ON c.donation_id = dn.id
     JOIN users u ON dn.ngo_id = u.id
     WHERE c.donor_id = ?
     ORDER BY c.created_at DESC`,
    [donorId]
  );

  return sendSuccess(res, contributions, 'My contributions');
};

export const getNgoContributions = async (req: AuthRequest, res: Response) => {
  const ngoId = toInt(req.user!.id);

  const contributions = await query<any>(
    `SELECT c.*, d.name AS donor_name, d.email AS donor_email, d.contact_info AS donor_contact_info,
            dn.purpose, dn.description, dn.donation_category, dn.donation_type, dn.quantity_or_amount
     FROM contributions c
     JOIN donors d ON c.donor_id = d.id
     JOIN donations dn ON c.donation_id = dn.id
     WHERE dn.ngo_id = ?
     ORDER BY c.created_at DESC`,
    [ngoId]
  );

  return sendSuccess(res, contributions, 'NGO contributions');
};

export const approveContribution = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Invalid contribution id' });
  }

  if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Use APPROVED, REJECTED, or COMPLETED' });
  }

  const contribution = await queryOne<any>(
    `SELECT c.*, dn.ngo_id, dn.id AS donation_id
     FROM contributions c
     JOIN donations dn ON c.donation_id = dn.id
     WHERE c.id = ?`,
    [id]
  );

  if (!contribution) {
    return res.status(404).json({ success: false, message: 'Contribution not found' });
  }

  if (String(contribution.ngo_id) !== String(req.user!.id) && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await update('UPDATE contributions SET status = ? WHERE id = ?', [status, id]);

  if (status === 'APPROVED') {
    await update('UPDATE donations SET status = ? WHERE id = ?', ['CONFIRMED', contribution.donation_id]);
  }

  const updatedContribution = await queryOne<any>('SELECT * FROM contributions WHERE id = ?', [id]);

  return sendSuccess(res, updatedContribution, `Contribution ${String(status).toLowerCase()}`);
};

export const updatePickupSchedule = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const { scheduledPickupTime } = req.body;

  if (!id || !scheduledPickupTime) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  if (!isFutureDate(scheduledPickupTime)) {
    return res.status(400).json({ success: false, message: 'Scheduled pickup must be in the future' });
  }

  const contribution = await queryOne<any>(
    `SELECT c.*, dn.ngo_id
     FROM contributions c
     JOIN donations dn ON c.donation_id = dn.id
     WHERE c.id = ?`,
    [id]
  );

  if (!contribution) {
    return res.status(404).json({ success: false, message: 'Contribution not found' });
  }

  if (String(contribution.ngo_id) !== String(req.user!.id) && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await update(
    'UPDATE contributions SET scheduled_pickup_time = ?, pickup_scheduled_date_time = ? WHERE id = ?',
    [new Date(scheduledPickupTime), new Date(scheduledPickupTime), id]
  );

  const updatedContribution = await queryOne<any>('SELECT * FROM contributions WHERE id = ?', [id]);

  return sendSuccess(res, updatedContribution, 'Pickup schedule updated');
};