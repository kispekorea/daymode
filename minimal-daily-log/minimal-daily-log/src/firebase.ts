import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app;
let auth;
let db;

// 앱이 실행될 때 json 파일을 읽어서 여기로 던져줄 겁니다.
export const initFirebase = (config) => {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  return { app, auth, db };
};

export { auth, db };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}