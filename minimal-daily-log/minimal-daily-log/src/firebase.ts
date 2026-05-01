import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSFMQHUi-Qast7WWwaAi0vD9NSvYkDFeU",
  authDomain: "gen-lang-client-0327863758.firebaseapp.com",
  projectId: "gen-lang-client-0327863758",
  storageBucket: "gen-lang-client-0327863758.firebasestorage.app",
  messagingSenderId: "1080163261323",
  appId: "1:1080163261323:web:1e3b6712c9ed1bfefdad8e"
};

// 데이터베이스 ID는 일단 기본값(default)으로 돌려놓겠습니다. 
// 로그인이 먼저 되어야 데이터고 뭐고 확인이 가능하니까요!
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}