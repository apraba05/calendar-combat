export interface Session {
  id: string;
  email: string;
  name: string;
  avatar: string;
  tokens: any;
}

declare global {
  var sessionStore: Map<string, Session> | undefined;
}

if (!globalThis.sessionStore) {
  globalThis.sessionStore = new Map<string, Session>();
}

export const getSessionStore = () => globalThis.sessionStore!;
