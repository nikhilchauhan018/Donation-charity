import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/mysql';
import { sendSuccess } from '../utils/response';

export const getPlatformStats = async (req: Request, res: Response) => {
  const donors = await query('SELECT COUNT(*) AS total FROM donors') as any[];
  const ngos = await query('SELECT COUNT(*) AS total FROM users') as any[];
  const donations = await query('SELECT COUNT(*) AS total FROM donations') as any[];
  const contributions = await query(
    "SELECT COUNT(*) AS total FROM contributions WHERE status IN ('APPROVED','COMPLETED')"
  ) as any[];

  const amount = await query(
    "SELECT COALESCE(SUM(quantity_or_amount),0) AS total FROM donations WHERE status='COMPLETED'"
  ) as any[];

  const pending = await query("SELECT COUNT(*) AS total FROM donations WHERE status='PENDING'") as any[];
  const completed = await query("SELECT COUNT(*) AS total FROM donations WHERE status='COMPLETED'") as any[];
  const urgent = await query(
    "SELECT COUNT(*) AS total FROM donations WHERE priority='URGENT' AND status!='COMPLETED'"
  ) as any[];

  return sendSuccess(res, {
    users: {
      totalDonors: donors[0]?.total || 0,
      totalNgos: ngos[0]?.total || 0,
      totalUsers: (donors[0]?.total || 0) + (ngos[0]?.total || 0)
    },
    donations: {
      total: donations[0]?.total || 0,
      pending: pending[0]?.total || 0,
      completed: completed[0]?.total || 0,
      urgent: urgent[0]?.total || 0
    },
    contributions: {
      total: contributions[0]?.total || 0,
      totalAmountDonated: amount[0]?.total || 0
    }
  }, 'Platform stats fetched');
};

export const getDonorStats = async (req: AuthRequest, res: Response) => {
  const donorId = req.user!.id;

  const total = await query('SELECT COUNT(*) AS total FROM contributions WHERE donor_id=?', [donorId]) as any[];
  const approved = await query("SELECT COUNT(*) AS total FROM contributions WHERE donor_id=? AND status='APPROVED'", [donorId]) as any[];
  const completed = await query("SELECT COUNT(*) AS total FROM contributions WHERE donor_id=? AND status='COMPLETED'", [donorId]) as any[];
  const pending = await query("SELECT COUNT(*) AS total FROM contributions WHERE donor_id=? AND status='PENDING'", [donorId]) as any[];

  const amount = await query(`
    SELECT COALESCE(SUM(d.quantity_or_amount),0) AS total
    FROM contributions c
    JOIN donations d ON c.donation_id=d.id
    WHERE c.donor_id=? AND c.status IN ('APPROVED','COMPLETED')
  `, [donorId]) as any[];

  const recent = await query(`
    SELECT c.*, d.purpose, d.description, d.donation_category, d.quantity_or_amount
    FROM contributions c
    JOIN donations d ON c.donation_id=d.id
    WHERE c.donor_id=?
    ORDER BY c.created_at DESC
    LIMIT 5
  `, [donorId]) as any[];

  return sendSuccess(res, {
    contributions: {
      total: total[0]?.total || 0,
      approved: approved[0]?.total || 0,
      completed: completed[0]?.total || 0,
      pending: pending[0]?.total || 0
    },
    totalAmountContributed: amount[0]?.total || 0,
    recentContributions: recent
  }, 'Donor stats fetched');
};

export const getNgoStats = async (req: AuthRequest, res: Response) => {
  const ngoId = req.user!.id;

  const total = await query('SELECT COUNT(*) AS total FROM donations WHERE ngo_id=?', [ngoId]) as any[];
  const pending = await query("SELECT COUNT(*) AS total FROM donations WHERE ngo_id=? AND status='PENDING'", [ngoId]) as any[];
  const confirmed = await query("SELECT COUNT(*) AS total FROM donations WHERE ngo_id=? AND status='CONFIRMED'", [ngoId]) as any[];
  const completed = await query("SELECT COUNT(*) AS total FROM donations WHERE ngo_id=? AND status='COMPLETED'", [ngoId]) as any[];

  const contributions = await query(`
    SELECT COUNT(c.id) AS total
    FROM contributions c
    JOIN donations d ON c.donation_id=d.id
    WHERE d.ngo_id=?
  `, [ngoId]) as any[];

  const amount = await query(`
    SELECT COALESCE(SUM(quantity_or_amount),0) AS total
    FROM donations
    WHERE ngo_id=? AND status='COMPLETED'
  `, [ngoId]) as any[];

  const recent = await query(`
    SELECT *
    FROM donations
    WHERE ngo_id=?
    ORDER BY created_at DESC
    LIMIT 5
  `, [ngoId]) as any[];

  return sendSuccess(res, {
    donations: {
      total: total[0]?.total || 0,
      pending: pending[0]?.total || 0,
      confirmed: confirmed[0]?.total || 0,
      completed: completed[0]?.total || 0
    },
    contributions: {
      total: contributions[0]?.total || 0
    },
    totalAmountReceived: amount[0]?.total || 0,
    recentDonations: recent
  }, 'NGO stats fetched');
};