import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query, queryOne, update } from '../config/mysql';
import { sendSuccess } from '../utils/response';

const toInt = (value: unknown) => Number.parseInt(String(value), 10);

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  const donorId = toInt(req.user!.id);
  const { paymentId, donorProvidedReference } = req.body;

  const paymentIdNum = toInt(paymentId);

  if (!paymentIdNum) {
    return res.status(400).json({ success: false, message: 'Payment ID is required' });
  }

  const payment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [paymentIdNum]);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (Number(payment.donor_id) !== donorId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only confirm your own payments' });
  }

  if (payment.payment_status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      message: `Payment is already ${String(payment.payment_status).toLowerCase()}. Cannot confirm again.`,
    });
  }

  await update('UPDATE payments SET donor_provided_reference = ? WHERE id = ?', [
    donorProvidedReference?.trim() || payment.donor_provided_reference || null,
    paymentIdNum,
  ]);

  const updatedPayment = await queryOne<any>(
    `SELECT p.*, d.name AS donor_name, d.email AS donor_email, dn.purpose, dn.description, dn.quantity_or_amount
     FROM payments p
     JOIN donors d ON p.donor_id = d.id
     JOIN donations dn ON p.donation_id = dn.id
     WHERE p.id = ?`,
    [paymentIdNum]
  );

  return sendSuccess(res, updatedPayment, 'Payment confirmation submitted. Waiting for verification.');
};

export const getNgoPayments = async (req: AuthRequest, res: Response) => {
  const ngoId = toInt(req.user!.id);
  const { paymentStatus, donationId } = req.query;

  let sql = `
    SELECT p.*, d.name AS donor_name, d.email AS donor_email, d.contact_info AS donor_contact_info,
           dn.purpose, dn.description, dn.quantity_or_amount
    FROM payments p
    JOIN donors d ON p.donor_id = d.id
    JOIN donations dn ON p.donation_id = dn.id
    WHERE p.ngo_id = ?
  `;
  const params: any[] = [ngoId];

  if (paymentStatus) {
    sql += ' AND p.payment_status = ?';
    params.push(paymentStatus);
  }

  if (donationId) {
    sql += ' AND p.donation_id = ?';
    params.push(toInt(donationId));
  }

  sql += ' ORDER BY p.created_at DESC';

  const payments = await query<any>(sql, params);

  return sendSuccess(res, { count: payments.length, payments }, 'Payments fetched successfully');
};

export const getNgoPaymentDetails = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const ngoId = toInt(req.user!.id);

  const payment = await queryOne<any>(
    `SELECT p.*, d.name AS donor_name, d.email AS donor_email, d.contact_info AS donor_contact_info,
            dn.purpose, dn.description, dn.quantity_or_amount
     FROM payments p
     JOIN donors d ON p.donor_id = d.id
     JOIN donations dn ON p.donation_id = dn.id
     WHERE p.id = ?`,
    [id]
  );

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (Number(payment.ngo_id) !== ngoId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return sendSuccess(res, payment, 'Payment details fetched successfully');
};

export const verifyNgoPayment = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const ngoId = toInt(req.user!.id);
  const { paymentStatus } = req.body;

  if (!['SUCCESS', 'FAILED'].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status. Must be SUCCESS or FAILED' });
  }

  const payment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [id]);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (Number(payment.ngo_id) !== ngoId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (payment.payment_status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      message: `Payment is already ${String(payment.payment_status).toLowerCase()}. Cannot verify again.`,
    });
  }

  await update(
    'UPDATE payments SET payment_status = ?, verified_by_role = ?, verified_by_id = ?, verified_at = NOW() WHERE id = ?',
    [paymentStatus, 'NGO', ngoId, id]
  );

  if (paymentStatus === 'SUCCESS') {
    await update("UPDATE donations SET status = 'CONFIRMED' WHERE id = ? AND status = 'PENDING'", [payment.donation_id]);
  }

  const updatedPayment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [id]);

  return sendSuccess(res, updatedPayment, `Payment marked as ${String(paymentStatus).toLowerCase()}`);
};

export const verifyOrgPayment = async (req: AuthRequest, res: Response) => {
  const id = toInt(req.params.id);
  const adminId = toInt(req.user!.id);
  const { paymentStatus } = req.body;

  if (!['SUCCESS', 'FAILED'].includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment status. Must be SUCCESS or FAILED' });
  }

  const payment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [id]);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  if (payment.payment_status !== 'PENDING') {
    return res.status(400).json({
      success: false,
      message: `Payment is already ${String(payment.payment_status).toLowerCase()}. Cannot verify again.`,
    });
  }

  await update(
    'UPDATE payments SET payment_status = ?, verified_by_role = ?, verified_by_id = ?, verified_at = NOW() WHERE id = ?',
    [paymentStatus, 'ADMIN', adminId, id]
  );

  if (paymentStatus === 'SUCCESS') {
    await update("UPDATE donations SET status = 'CONFIRMED' WHERE id = ? AND status = 'PENDING'", [payment.donation_id]);
  }

  const updatedPayment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [id]);

  return sendSuccess(res, updatedPayment, `Payment marked as ${String(paymentStatus).toLowerCase()}`);
};

export const getAllOrgPayments = async (req: AuthRequest, res: Response) => {
  const { paymentStatus, ngoId, donationId } = req.query;

  let sql = `
    SELECT p.*, d.name AS donor_name, d.email AS donor_email,
           u.name AS ngo_name, u.email AS ngo_email,
           dn.purpose, dn.description, dn.quantity_or_amount
    FROM payments p
    JOIN donors d ON p.donor_id = d.id
    JOIN users u ON p.ngo_id = u.id
    JOIN donations dn ON p.donation_id = dn.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (paymentStatus) {
    sql += ' AND p.payment_status = ?';
    params.push(paymentStatus);
  }

  if (ngoId) {
    sql += ' AND p.ngo_id = ?';
    params.push(toInt(ngoId));
  }

  if (donationId) {
    sql += ' AND p.donation_id = ?';
    params.push(toInt(donationId));
  }

  sql += ' ORDER BY p.created_at DESC';

  const payments = await query<any>(sql, params);

  return sendSuccess(res, { count: payments.length, payments }, 'All payments fetched successfully');
};