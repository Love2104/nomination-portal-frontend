import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAadcj9QbkXWDzSVIfTs2Hz8Z3YywkM-Ak",
    authDomain: "nomination-portal-iitk.firebaseapp.com",
    projectId: "nomination-portal-iitk",
    storageBucket: "nomination-portal-iitk.firebasestorage.app",
    messagingSenderId: "470106775428",
    appId: "1:470106775428:web:636e5160a3be1e41e9c7d1",
    measurementId: "G-K4SHN9Q9GZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
