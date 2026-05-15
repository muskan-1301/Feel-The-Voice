import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Session } from './types';

interface IntelligenceDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<IntelligenceDB>> | null = null;

function getDb(): Promise<IDBPDatabase<IntelligenceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<IntelligenceDB>('SpeechIntelligenceDB', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export async function saveSessionToDB(session: Session) {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getSessionsFromDB(): Promise<Session[]> {
  const db = await getDb();
  return db.getAllFromIndex('sessions', 'by-timestamp');
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}

export async function deleteSession(id: string) {
  const db = await getDb();
  await db.delete('sessions', id);
}

// Basic cosine similarity calculation
export function dotProduct(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}
