import fs from 'fs';
import path from 'path';

export interface Session {
  id: string;
  email: string;
  name: string;
  avatar: string;
  tokens: any;
}

const dbPath = path.join(process.cwd(), 'sessionStore.json');

const readDb = (): Map<string, Session> => {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return new Map(Object.entries(JSON.parse(data)));
    }
  } catch (e) {}
  return new Map<string, Session>();
};

const writeDb = (map: Map<string, Session>) => {
  fs.writeFileSync(dbPath, JSON.stringify(Object.fromEntries(map)));
};

export const getSessionStore = () => ({
  get: (id: string) => readDb().get(id),
  set: (id: string, session: Session) => {
    const map = readDb();
    map.set(id, session);
    writeDb(map);
  }
});
