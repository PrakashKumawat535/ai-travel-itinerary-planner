import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Dynamically negotiate JWT secret for production safety
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: The JWT_SECRET environment variable is required in production environments!');
  } else {
    // Generate a secure single-use key for safety in development fallback mode
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Warn] JWT_SECRET not configured. A dynamic cryptographic key has been provisioned.');
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function signToken(payload: { id: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // Expires in 24 hours
  const expiry = Math.floor(Date.now() / 1000) + 86400;
  const body = Buffer.from(JSON.stringify({ ...payload, exp: expiry })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const computedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    
    if (signature !== computedSignature) return null;
    
    const decodedPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    
    if (decodedPayload.exp && (Date.now() / 1000) > decodedPayload.exp) {
      return null; // Expired
    }
    
    return {
      id: decodedPayload.id,
      email: decodedPayload.email
    };
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Your session has expired or is invalid. Please log in again.' });
  }

  req.user = decoded;
  next();
}
