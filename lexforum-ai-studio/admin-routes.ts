import admin from 'firebase-admin';
import type { Application, Request, Response } from 'express';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'talessc@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(req: Request, res: Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

export function registerAdminRoutes(
  app: Application,
  adminDb: admin.firestore.Firestore
): void {

  // Confirma se o usuário autenticado é admin, sem expor nenhum dado ainda.
  app.get('/api/admin/whoami', async (req: Request, res: Response) => {
    const uid = await requireAdmin(req, res);
    if (!uid) return;
    res.json({ ok: true });
  });

  app.get('/api/admin/overview', async (req: Request, res: Response) => {
    const uid = await requireAdmin(req, res);
    if (!uid) return;

    try {
      const [usersSnap, statsSnap, simsSnap, apiTrafficSnap] = await Promise.all([
        adminDb.collection('users').orderBy('createdAt', 'desc').limit(200).get(),
        adminDb.collection('stats').doc('global').get(),
        adminDb.collection('simulations').orderBy('createdAt', 'desc').limit(50).get(),
        adminDb.collection('stats').doc('apiTraffic').get(),
      ]);

      const users = usersSnap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email ?? null,
          accessLevel: data.accessLevel ?? 'free',
          createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        };
      });

      const statsData = statsSnap.exists ? statsSnap.data()! : { totalSimulations: 0, totalWins: 0 };
      const totalSimulations = statsData.totalSimulations || 0;
      const totalWins = statsData.totalWins || 0;

      const apiTrafficData = apiTrafficSnap.exists ? apiTrafficSnap.data()! : { totalCalls: 0, byEndpoint: {} };
      const totalApiCalls = apiTrafficData.totalCalls || 0;
      const byEndpoint: Record<string, number> = apiTrafficData.byEndpoint || {};

      const simulations = simsSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId ?? null,
          area: data.area ?? null,
          selectedMode: data.selectedMode ?? null,
          finalSuccessProbability: data.finalSuccessProbability ?? null,
          isWin: data.isWin ?? null,
          createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        };
      });

      res.json({
        users,
        stats: {
          totalSimulations,
          totalWins,
          winRate: totalSimulations > 0 ? Number(((totalWins / totalSimulations) * 100).toFixed(1)) : 0,
        },
        apiTraffic: {
          totalCalls: totalApiCalls,
          byEndpoint,
        },
        simulations,
      });
    } catch (error) {
      console.error('[admin/overview]', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  app.post('/api/admin/users/:targetUid/access-level', async (req: Request, res: Response) => {
    const uid = await requireAdmin(req, res);
    if (!uid) return;

    const { targetUid } = req.params;
    const { accessLevel } = req.body;
    if (accessLevel !== 'free' && accessLevel !== 'beta') {
      res.status(400).json({ error: 'accessLevel must be "free" or "beta"' });
      return;
    }

    try {
      const ref = adminDb.collection('users').doc(targetUid);
      const snap = await ref.get();
      if (!snap.exists) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      await ref.update({ accessLevel });
      res.json({ ok: true });
    } catch (error) {
      console.error('[admin/access-level]', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });
}
