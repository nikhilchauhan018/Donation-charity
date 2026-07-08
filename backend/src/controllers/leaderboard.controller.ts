import { Request, Response } from 'express';
import { query } from '../config/mysql';
import { sendSuccess } from '../utils/response';

const getPeriodSql = (period: any) => {
  if (period === 'monthly') return 'AND c.created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")';
  if (period === 'weekly') return 'AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  return '';
};

export const getDonorLeaderboard = async (req: Request, res: Response) => {
  const { period = 'all' } = req.query;
  const periodSql = getPeriodSql(period);

  const rows = await query(`
    SELECT 
      c.donor_id AS donorId,
      d.name AS donorName,
      d.email AS donorEmail,
      COUNT(c.id) AS totalContributions,
      COALESCE(SUM(don.quantity_or_amount),0) AS totalAmount,
      SUM(CASE WHEN c.status='COMPLETED' THEN 1 ELSE 0 END) AS completedContributions,
      MAX(c.created_at) AS lastContributionDate
    FROM contributions c
    JOIN donors d ON c.donor_id=d.id
    JOIN donations don ON c.donation_id=don.id
    WHERE c.status IN ('APPROVED','COMPLETED') ${periodSql}
    GROUP BY c.donor_id, d.name, d.email
    ORDER BY totalContributions DESC, totalAmount DESC
    LIMIT 100
  `) as any[];

  const leaderboard = rows.map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  return sendSuccess(res, { period, leaderboard }, 'Leaderboard fetched');
};

export const getNgoLeaderboard = async (req: Request, res: Response) => {
  const { period = 'all' } = req.query;

  let periodSql = '';
  if (period === 'monthly') periodSql = 'WHERE d.created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")';
  if (period === 'weekly') periodSql = 'WHERE d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';

  const rows = await query(`
    SELECT
      d.ngo_id AS ngoId,
      u.name AS ngoName,
      u.email AS ngoEmail,
      u.contact_info AS contactInfo,
      COUNT(d.id) AS totalDonations,
      COALESCE(SUM(d.quantity_or_amount),0) AS totalAmount,
      SUM(CASE WHEN d.status='COMPLETED' THEN 1 ELSE 0 END) AS completedDonations,
      SUM(CASE WHEN d.priority='URGENT' THEN 1 ELSE 0 END) AS urgentDonations
    FROM donations d
    JOIN users u ON d.ngo_id=u.id
    ${periodSql}
    GROUP BY d.ngo_id, u.name, u.email, u.contact_info
    ORDER BY totalDonations DESC, totalAmount DESC
    LIMIT 50
  `) as any[];

  const leaderboard = rows.map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  return sendSuccess(res, { period, leaderboard }, 'NGO leaderboard fetched');
};