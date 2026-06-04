import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Não autorizado.' });
  }
}
