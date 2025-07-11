import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useUserStore } from '@/store/userStore';
import { UserProfile } from '@/types';
import { useThemeStore } from '@/store/themeStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { theme, syncThemeWithFirebase } = useThemeStore();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setProfile = useUserStore((state) => state.setProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create or update user profile in Firestore
  const createUserProfile = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || null,
        bio: '',
        favoriteGenres: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        settings: {
          theme
        }
      }
      await setDoc(userRef, profile);
      setProfile(profile);
    } else {
      // Update last login and sync theme
      await setDoc(userRef, {
        updatedAt: serverTimestamp() as Timestamp
      }, { merge: true });
      setProfile(userSnap.data() as UserProfile);

      // Sync theme from Firebase
      await syncThemeWithFirebase(user.uid);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);

        if (firebaseUser) {
          // Set user immediately to prevent redirect loop
          setUser(firebaseUser);

          // Then create/update profile
          await createUserProfile(firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
        // Even if profile creation fails, we should still set the user
        if (firebaseUser) {
          setUser(firebaseUser);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      // Profile creation and theme sync will be handled by onAuthStateChanged
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // Profile creation and theme sync will be handled by onAuthStateChanged
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Email sign-in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      if (result.user) {
        await updateProfile(result.user, { displayName });
      }
      // Profile creation and theme sync will be handled by onAuthStateChanged
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Sign-up error:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Logout error:', error);
      setError(error.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email');
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
