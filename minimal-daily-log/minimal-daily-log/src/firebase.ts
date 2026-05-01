import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. 설정값을 파일에서 불러오지 않고 여기에 직접 고정합니다.
const firebaseConfig = {
  projectId: "gen-lang-client-0327863758",
  appId: "1:1080163261323:web:1e3b6712c9ed1bfefdad8e",
  apiKey: "AIzaSyDSFMQHUi-Qast7WWwaAi0vD9NSvyKdFEU", // 소문자 v'y'KdFEU 확인 완료
  authDomain: "gen-lang-client-0327863758.firebaseapp.com",
  storageBucket: "gen-lang-client-0327863758.firebasestorage.app",
  messagingSenderId: "1080163261323"
};

// 2. 긴 이름의 데이터베이스 ID도 여기에 직접 넣습니다.
const databaseId = "ai-studio-9b041de8-25f1-45e8-b8d2-8888800a5f71a";

// 3. 파이어베이스 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// 4. 기존에 있던 타입 정의 (그대로 유지)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}