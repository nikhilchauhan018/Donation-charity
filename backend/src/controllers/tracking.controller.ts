import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query, queryOne } from '../config/mysql';
import { sendSuccess } from '../utils/response';

const toInt = (value: unknown) => Number.parseInt(String(value), 10);

export const trackDonation = async (req: Request, res: Response) => {
  const id = toInt(req.params.id);

  const donation = await queryOne<any>(
    `SELECT d.*, u.name AS ngo_name, u.email AS ngo_email, u.contact_info AS ngo_contact_info
     FROM donations d
     JOIN users u ON d.ngo_id = u.id
     WHERE d.id = ?`,
    [id]
  );

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  const contributions = await query<any>(
    `SELECT c.*, dr.name AS donor_name, dr.email AS donor_email
     FROM contributions c
     JOIN donors dr ON c.donor_id = dr.id
     WHERE c.donation_id = ?
     ORDER BY c.created_at DESC`,
    [id]
  );

  return sendSuccess(res, { donation, contributions }, 'Donation tracking details fetched');
};

export const trackMyContributions = async (req: AuthRequest, res: Response) => {
  const donorId = toInt(req.user!.id);
  const { status } = req.query;

  let sql = `
    SELECT c.*, d.purpose, d.description, d.donation_category, d.donation_type, d.quantity_or_amount,
           u.name AS ngo_name, u.email AS ngo_email
    FROM contributions c
    JOIN donations d ON c.donation_id = d.id
    JOIN users u ON d.ngo_id = u.id
    WHERE c.donor_id = ?
  `;
  const params: any[] = [donorId];

  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY c.created_at DESC';

  const contributions = await query<any>(sql, params);

  return sendSuccess(res, contributions, 'Contribution tracking fetched');
};

export const getUpcomingPickups = async (req: AuthRequest, res: Response) => {
  const donorId = toInt(req.user!.id);

  const pickups = await query<any>(
    `SELECT c.*, d.purpose, d.donation_category, d.donation_type, d.quantity_or_amount,
            u.name AS ngo_name, u.email AS ngo_email
     FROM contributions c
     JOIN donations d ON c.donation_id = d.id
     JOIN users u ON d.ngo_id = u.id
     WHERE c.donor_id = ?
       AND c.pickup_status = 'SCHEDULED'
       AND c.pickup_scheduled_date_time >= NOW()
     ORDER BY c.pickup_scheduled_date_time ASC`,
    [donorId]
  );

  return sendSuccess(res, { count: pickups.length, pickups }, 'Upcoming pickups fetched');
};

export const getNgoUpcomingPickups = async (req: AuthRequest, res: Response) => {
  const ngoId = toInt(req.user!.id);

  const pickups = await query<any>(
    `SELECT c.*, dr.name AS donor_name, dr.email AS donor_email,
            d.purpose, d.donation_category, d.donation_type, d.quantity_or_amount
     FROM contributions c
     JOIN donors dr ON c.donor_id = dr.id
     JOIN donations d ON c.donation_id = d.id
     WHERE d.ngo_id = ?
       AND c.pickup_status = 'SCHEDULED'
       AND c.pickup_scheduled_date_time >= NOW()
     ORDER BY c.pickup_scheduled_date_time ASC`,
    [ngoId]
  );

  return sendSuccess(res, { count: pickups.length, pickups }, 'NGO upcoming pickups fetched');
};