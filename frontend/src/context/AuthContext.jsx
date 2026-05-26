import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
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
        localStorage.setItem('nexus_token', idToken);
        
        let userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
        };
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              userData = {
                ...userData,
                ...data.user,
                name: data.user.name || userData.name,
                email: data.user.email || userData.email,
              };
            }
          }
        } catch (err) {
          console.error('Failed to fetch user stats from backend:', err.message);
        }
        
        setUser(userData);
        setToken(idToken);
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

  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem('nexus_token');
    if (!currentToken) return;
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(prev => {
            const updated = {
              ...prev,
              ...data.user,
              name: data.user.name || prev?.name,
              email: data.user.email || prev?.email,
            };
            localStorage.setItem('nexus_user', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh user stats:', err.message);
    }
  }, [token]);

  const register = useCallback(async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await userCredential.user.reload();
    
    const refreshedUser = auth.currentUser;
    const idToken = await refreshedUser.getIdToken(true);
    let userData = {
      uid: refreshedUser.uid,
      email: refreshedUser.email,
      displayName: name,
      name: name
    };

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          userData = {
            ...userData,
            ...data.user,
            name: data.user.name || userData.name,
            email: data.user.email || userData.email,
          };
        }
      }
    } catch (err) {
      console.error('Failed to initialize user database profile:', err.message);
    }
    
    setUser(userData);
    setToken(idToken);
    localStorage.setItem('nexus_token', idToken);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
    
    return { user: refreshedUser };
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
      refreshUser,
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
