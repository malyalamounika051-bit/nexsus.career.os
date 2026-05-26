import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAHJbxJUnbhfXdmgWArMRO060ZjpMOhBzM",
  authDomain: "nexus-os-e49a9.firebaseapp.com",
  projectId: "nexus-os-e49a9",
  storageBucket: "nexus-os-e49a9.firebasestorage.app",
  messagingSenderId: "944036352568",
  appId: "1:944036352568:web:504aeeafe50e068a564ccd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
