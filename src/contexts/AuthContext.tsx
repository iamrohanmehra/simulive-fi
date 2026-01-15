import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  type User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { userDoc } from '@/lib/firestore-collections';
import { toast } from 'sonner';

/**
 * Response type for email verification API
 */
// Custom User Data from Codekaro API
export // FIXED #38: Define Course interface instead of any[]
interface Course {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface UserData {
  name: string;
  avatar: string;
  courses: Course[];
}

interface EmailVerificationResponse {
  verified: boolean;
  userData?: UserData;
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

  /**
   * Validates email via Codekaro API and signs in anonymously
   */
  loginWithCodekaro: (email: string) => Promise<UserData | null>;
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
   * Signs out the currently authenticated user
   */
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      toast.error('Failed to sign out.');
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
      // Use env var or fallback to the known public API URL
      const apiUrl = import.meta.env.VITE_CODEKARO_API_URL || 'https://codekaro.in/api';
      
      // API Requirement: GET https://codekaro.in/api/user/{email}
      console.log(`Verifying email: ${email} against ${apiUrl}/user/${email}`);
      const response = await fetch(`${apiUrl}/user/${email}`);

      if (!response.ok) {
        if (response.status === 404) {
             console.warn('User not found in Codekaro API');
             return { verified: false };
        }
        throw new Error(`API Error: ${response.statusText}`);
      }

      const userProfile = await response.json();
      
      // Validate that we actually got a user profile
      if (userProfile && (userProfile.email || userProfile.id)) {
        
        // Map API response to our UserData structure
        // The API likely returns: { name, email, avatar, etc } 
        // We'll map what we can.
        const mappedUserData: UserData = {
            name: userProfile.name || userProfile.fullName || 'Student',
            avatar: userProfile.avatar || userProfile.picture || userProfile.photoUrl || '',
            courses: userProfile.courses || []
        };

        const userDataToStore = {
          name: mappedUserData.name,
          avatar: mappedUserData.avatar,
          courses: mappedUserData.courses,
          email: email,
          verifiedAt: new Date().toISOString()
        };

        // Store user data in localStorage for persistence
        localStorage.setItem('codekaroUserData', JSON.stringify(userDataToStore));

        // Update Firestore user document with verified status if user is authenticated (which they will be shortly)
        if (user) {
          try {
            await setDoc(userDoc(user.uid), {
              isVerified: true,
              fullName: mappedUserData.name,
              avatarUrl: mappedUserData.avatar || null,
            }, { merge: true });
          } catch (firestoreError) {
             // Ignore
          }
        }

        return {
          verified: true,
          userData: mappedUserData
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Codekaro Verification Error:', error);
      toast.error('Error connecting to verification service');
      return { verified: false };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    verifyEmailWithAPI,
    loginWithCodekaro
  };

  /**
   * Log in using Codekaro API verification and Firebase Anonymous Auth
   * @param email The email to verify and login with
   */
  async function loginWithCodekaro(email: string): Promise<UserData | null> {
    setLoading(true);
    try {
      const result = await verifyEmailWithAPI(email);
      if (result.verified && result.userData) {
          // 1. Sign in anonymously to Firebase
          // Try to sign in. If already signed in anonymously, this might persist
          // but we want to ensure we're connected.
          const { signInAnonymously } = await import('firebase/auth');
          const credential = await signInAnonymously(auth);
          const user = credential.user;

          // 2. Update profile with data from API
          await updateProfile(user, {
              displayName: result.userData.name,
              photoURL: result.userData.avatar
          });

          // 3. Update/Create user document in Firestore
          // We use the anonymous UID but store the real email
          await setDoc(userDoc(user.uid), {
             id: user.uid,
             email: email,
             fullName: result.userData.name,
             avatarUrl: result.userData.avatar,
             isVerified: true,
             lastSeen: serverTimestamp()
          } as any, { merge: true });

          // 4. Force state update if needed (listener usually handles it)
          setUser(user);
          
          return result.userData;
      } else {
         throw new Error("Email verification failed");
      }
    } catch(err) {
       console.error(err);
       throw err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
