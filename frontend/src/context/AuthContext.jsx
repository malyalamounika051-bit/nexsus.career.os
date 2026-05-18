import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  // Sync Firebase Auth state with local context
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We use the Firebase ID token as our nexus_token for now
        const idToken = await firebaseUser.getIdToken();
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0]
        };
        
        setUser(userData);
        setToken(idToken);
        localStorage.setItem('nexus_token', idToken);
        localStorage.setItem('nexus_user', JSON.stringify(userData));
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  }, []);

  const googleLogin = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('nexus_user', JSON.stringify({ ...user, ...updatedUser }));
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      googleLogin,
      register, 
      logout, 
      updateUser, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
