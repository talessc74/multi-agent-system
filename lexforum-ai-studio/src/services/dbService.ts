import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  getDocs,
  query,
  limit,
  orderBy,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { SimulationResult, LegalArea } from '../types';
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
  report: any = null
) => {
  const isWin = result.finalSuccessProbability >= 50;

  const anon = anonymizeSimulation({
    caseDescription,
    caseSummary,
    rounds: result.rounds,
    report,
  });

  try {
    // Save simulation record
    await addDoc(collection(db, 'simulations'), {
      userId,
      caseDescription: anon.caseDescription,
      caseSummary: anon.caseSummary,
      area: result.area,
      finalSuccessProbability: result.finalSuccessProbability,
      lawyerAgentName: result.lawyerAgentName,
      judgeAgentName: result.judgeAgentName,
      rounds: anon.rounds,
      report: anon.report,
      isWin,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'simulations');
  }

  try {
    // Update global stats
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
    handleFirestoreError(error, OperationType.WRITE, 'stats/global');
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
  return { totalSimulations: 14282, totalWins: 10682, winRate: 74.8 }; // Mock fallback
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
}
