import { Request, Response } from 'express';
import { db, hashPassword, verifyPassword } from '../config/db';
import { signToken } from '../middlewares/authMiddleware';

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required fields.' });
    }

    // Protect against NoSQL injection (e.g. object inputs { $gt: "" })
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be plain text strings.' });
    }

    // Direct regex validation for email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    }

    // De-duplicate email registry
    const existingUser = await db.users.findOne(email);
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    // Cryptographic securely salt and hash password
    const { hash, salt } = hashPassword(password);
    const createdUser = await db.users.create(email, hash, salt);

    // Issue Token
    const token = signToken({ id: createdUser.id, email: createdUser.email });

    return res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        createdAt: createdUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration failure error:', error);
    return res.status(500).json({ error: 'Internal system error during sign up. Please try again.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Protect against NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password must be plain text strings.' });
    }

    const fetchedUser = await db.users.findOne(email);
    if (!fetchedUser) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isMatch = verifyPassword(password, fetchedUser.passwordHash, fetchedUser.salt);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = signToken({ id: fetchedUser.id, email: fetchedUser.email });

    return res.json({
      token,
      user: {
        id: fetchedUser.id,
        email: fetchedUser.email,
        createdAt: fetchedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Login failure error:', error);
    return res.status(500).json({ error: 'Internal system error during login. Please try again.' });
  }
}
