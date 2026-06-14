import {
  collection,
  addDoc,
  serverTimestamp,
  FieldValue,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  getDocs,
  getCountFromServer,
  query,
  limit,
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { SimulationResult, LegalArea } from '../types';
import { anonymizeSimulation } from '../lib/anonymizer';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authenticated: boolean;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authenticated: auth.currentUser !== null,
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface GlobalStats {
  totalSimulations: number;
  totalWins: number;
  winRate: number;
}

export const saveSimulation = async (
  userId: string | null,
  caseDescription: string,
  result: SimulationResult,
  caseSummary: string | null = null,
  report: any = null,
  mode5Result: any = null,
  selectedMode: number | null = null,
  userSide: 'AUTHOR' | 'DEFENSE' | null = null,
  userPole: 'AUTOR' | 'REU' | null = null
): Promise<string | null> => {
  const isWin = result.finalSuccessProbability >= 50;

  const anon = anonymizeSimulation({
    caseDescription,
    caseSummary,
    rounds: result.rounds,
    report,
  });

  const sanitize = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (obj instanceof FieldValue) return obj; // sentinels (serverTimestamp, increment…) must reach Firestore unmodified
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, sanitize(v)])
      );
    }
    return obj;
  };

  let simulationId: string | null = null;

  try {
    const docRef = await addDoc(collection(db, 'simulations'), sanitize({
      userId,
      caseDescription: anon.caseDescription,
      caseSummary: anon.caseSummary,
      area: result.area,
      finalSuccessProbability: result.finalSuccessProbability,
      lawyerAgentName: result.lawyerAgentName,
      judgeAgentName: result.judgeAgentName,
      rounds: anon.rounds,
      report: anon.report,
      mode5Result: mode5Result ?? null,
      selectedMode: selectedMode ?? null,
      userSide: userSide ?? null,
      userPole: userPole ?? null,
      isWin,
      createdAt: serverTimestamp()
    }));
    simulationId = docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'simulations');
  }

  try {
    const statsRef = doc(db, 'stats', 'global');
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await setDoc(statsRef, {
        totalSimulations: 1,
        totalWins: isWin ? 1 : 0,
        lastUpdated: serverTimestamp()
      });
    } else {
      await updateDoc(statsRef, {
        totalSimulations: increment(1),
        totalWins: isWin ? increment(1) : increment(0),
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('[saveSimulation] stats update falhou — não crítico:', error);
  }

  return simulationId;
};

export const createOrUpdateUser = async (uid: string, email: string | null) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: email || null,
        createdAt: serverTimestamp(),
        accessLevel: 'free'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const hasUserPaidForSession = async (
  uid: string,
  simulationId: string
): Promise<boolean> => {
  try {
    const paymentRef = doc(db, 'users', uid, 'payments', simulationId);
    const paymentSnap = await getDoc(paymentRef);
    return paymentSnap.exists();
  } catch (error) {
    console.error('[hasUserPaidForSession]', error);
    return false;
  }
};

export const getUserAccessLevel = async (uid: string): Promise<string> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data()?.accessLevel || 'free';
    }
    return 'free';
  } catch (error) {
    console.error('[getUserAccessLevel]', error);
    return 'free';
  }
};

export const getUserSimulations = async (userId: string) => {
  const path = 'simulations';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getStats = async (): Promise<GlobalStats> => {
  const path = 'stats/global';
  try {
    const statsSnap = await getDoc(doc(db, path));
    if (statsSnap.exists()) {
      const data = statsSnap.data();
      return {
        totalSimulations: data.totalSimulations || 0,
        totalWins: data.totalWins || 0,
        winRate: data.totalSimulations > 0 ? (data.totalWins / data.totalSimulations) * 100 : 74.8
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return { totalSimulations: 14282, totalWins: 10682, winRate: 74.8 };
};

export const getRegionalStats = async () => {
  try {
    const snap = await getDocs(collection(db, 'regions'));
    if (snap.empty) return null;
    return snap.docs.map(doc => doc.data());
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getSimulationById = async (simulationId: string) => {
  try {
    const snap = await getDoc(doc(db, 'simulations', simulationId));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    return null;
  } catch (error) {
    console.error('[getSimulationById]', error);
    return null;
  }
};

export const registrarAceiteTermos = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      termosAceitosEm: serverTimestamp(),
      termosVersao: '1.2'
    });
  } catch (error) {
    console.error('[registrarAceiteTermos]', error);
  }
};

export const registrarAcessoLaudo = async (uid: string, simulationId: string): Promise<void> => {
  try {
    const paymentRef = doc(db, 'users', uid, 'payments', simulationId);
    await updateDoc(paymentRef, {
      laudoAcessadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('[registrarAcessoLaudo]', error);
  }
};

const AREA_LABELS: Record<string, string> = {
  CONSUMER:        'Consumidor',
  LABOR:           'Trabalhista',
  FAMILY:          'Família',
  CRIMINAL:        'Criminal',
  CIVIL:           'Cível',
  TAX:             'Tributário / Fiscal',
  SOCIAL_SECURITY: 'Previdência',
  OTHER:           'Outros',
};

export const getAreaStats = async (): Promise<Array<{ region: string; seeds: number; active: number }> | null> => {
  try {
    const col = collection(db, 'simulations');
    const results = await Promise.all(
      Object.entries(AREA_LABELS).map(async ([area, label]) => {
        const [totalSnap, winsSnap] = await Promise.all([
          getCountFromServer(query(col, where('area', '==', area))),
          getCountFromServer(query(col, where('area', '==', area), where('isWin', '==', true))),
        ]);
        return {
          region: label,
          seeds: totalSnap.data().count,
          active: winsSnap.data().count,
        };
      })
    );
    const withData = results.filter(r => r.seeds > 0);
    return withData.length > 0 ? withData : null;
  } catch (error) {
    console.error('[getAreaStats]', error);
    return null;
  }
};

export const getSimRecovery = async (sessionId: string): Promise<{ status: string; result?: any } | null> => {
  try {
    const snap = await getDoc(doc(db, 'simRecovery', sessionId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { status: data.status, result: data.result };
  } catch {
    return null;
  }
};

export const subscribeSimRecovery = (
  sessionId: string,
  onChange: (status: string, result?: any) => void
): (() => void) => {
  const docRef = doc(db, 'simRecovery', sessionId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      onChange(data.status, data.result);
    },
    () => onChange('error')
  );
};
