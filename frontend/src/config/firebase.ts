import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDVC6t2pWrI73EV31tdrzAdtTHxnkXkA7Y",
  authDomain: "parkease-5f337.firebaseapp.com",
  projectId: "parkease-5f337",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
