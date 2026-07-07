import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../utils/mysql-auth-helper';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'DONOR' | 'NGO' | 'ADMIN';
    email: string;
  };
}
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log(`[Auth Middleware] 🔍 Request received - Path: ${req.path}, Method: ${req.method}`);
    console.log(`[Auth Middleware] 🔍 Has Authorization header: ${!!req.headers.authorization}`);


    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {


      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];


    const payload = verifyToken(token);
    console.log(`[Auth Middleware] 🔍 Token payload decoded - UserID: ${payload.userId}, Role in token: "${payload.role}" (type: ${typeof payload.role}), Email: ${payload.email}`);




    const tokenRole = (payload.role || '').toUpperCase();
    const user = await findUserById(payload.userId, tokenRole);
    console.log(`[Auth Middleware] 🔍 User lookup result - Found: ${!!user}, Role from DB: "${user?.role}", Token Role: "${tokenRole}", ID: ${user?.id}`);


    if (!user) {


      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (user.isBlocked) {


      return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
    }

    const normalizedRole = (user.role || '').toUpperCase() as 'DONOR' | 'NGO' | 'ADMIN';
    req.user = { id: user.id.toString(), role: normalizedRole, email: user.email };
    
    console.log(`[Auth Middleware] ✅ User authenticated - ID: ${req.user.id}, Role: ${req.user.role}, Email: ${req.user.email}`);


    next();
  } catch (error) {


    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

