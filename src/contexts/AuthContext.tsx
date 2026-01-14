import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { userDoc } from '@/lib/firestore-collections';
import type { User } from '@/lib/types';

/**
 * Response type for email verification API
 */
interface EmailVerificationResponse {
  verified: boolean;
  userData?: any;
}

/**
 * Authentication context type definition
 * Provides user state and authentication methods throughout the app
 */
export interface AuthContextType {
  /** Currently authenticated user, null if not signed in */
  user: FirebaseUser | null;
  
  /** Loading state while checking authentication status */
  loading: boolean;
  
  /**
   * Signs in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if sign in fails
   */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  
  /**
   * Creates a new user account with email and password
   * @param email - User's email address
   * @param password - User's password
   * @param fullName - User's full name for profile
   * @throws Error if sign up fails
   */
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  
  /**
   * Signs out the currently authenticated user
   * @throws Error if sign out fails
   */
  signOut: () => Promise<void>;
  
  /**
   * Verifies an email address against the external API
   * @param email - Email address to verify
   * @returns Object containing verification status and optional user data
   */
  verifyEmailWithAPI: (email: string) => Promise<EmailVerificationResponse>;
}

/**
 * Authentication context for managing user auth state
 * Must be used within an AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * @returns AuthContextType with user state and auth methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Wraps the app to provide authentication context to all children
 * Manages Firebase authentication state and provides auth methods
 * @param props - Component props containing children to render
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Subscribe to Firebase auth state changes
   * Updates user state when auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Signs in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  /**
   * Creates a new user account with email and password
   * Also updates the user's display name and creates a Firestore document
   * @param email - User's email address
   * @param password - User's password
   * @param fullName - User's full name for profile
   */
  const signUpWithEmail = async (
    email: string, 
    password: string, 
    fullName: string
  ): Promise<void> => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Update the user's display name in Firebase Auth
      await updateProfile(newUser, {
        displayName: fullName
      });

      // Create user document in Firestore
      await setDoc(userDoc(newUser.uid), {
        id: newUser.uid,
        email: email,
        fullName: fullName,
        avatarUrl: null,
        isVerified: false,
        createdAt: serverTimestamp()
      } as unknown as User);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  /**
   * Signs out the currently authenticated user
   */
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  /**
   * Verifies an email address against the external Codekaro API
   * Stores user data in localStorage if verified and updates Firestore document
   * @param email - Email address to verify
   * @returns Object containing verification status and optional user data
   * 
   * TODO: Configure VITE_CODEKARO_API_URL in .env file
   */
  const verifyEmailWithAPI = async (email: string): Promise<EmailVerificationResponse> => {
    try {
      const apiUrl = import.meta.env.VITE_CODEKARO_API_URL;
      
      if (!apiUrl) {
        console.error('VITE_CODEKARO_API_URL is not configured');
        return { verified: false };
      }

      const response = await fetch(`${apiUrl}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error('Email verification API error:', response.status);
        return { verified: false };
      }

      const data = await response.json();

      if (data.verified && data.userData) {
        // Store user data in localStorage for persistence
        localStorage.setItem('codekaroUserData', JSON.stringify({
          name: data.userData.name,
          avatar: data.userData.avatar,
          courses: data.userData.courses,
          email: email,
          verifiedAt: new Date().toISOString()
        }));

        // Update Firestore user document with verified status if user is authenticated
        if (user) {
          try {
            await setDoc(userDoc(user.uid), {
              isVerified: true,
              fullName: data.userData.name || user.displayName,
              avatarUrl: data.userData.avatar || null,
            }, { merge: true });
          } catch (firestoreError) {
            console.error('Error updating Firestore user document:', firestoreError);
            // Don't fail the verification if Firestore update fails
          }
        }

        return {
          verified: true,
          userData: {
            name: data.userData.name,
            avatar: data.userData.avatar,
            courses: data.userData.courses
          }
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Error verifying email with API:', error);
      return { verified: false };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    verifyEmailWithAPI
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
