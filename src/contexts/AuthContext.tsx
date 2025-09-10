import React, { createContext, useCallback, useContext, useState } from 'react';
import type { AuthUserWithProfile } from '../types/user-management';
import { supabase } from '../utils/supabase';
import type { Session } from '@supabase/supabase-js';

interface OtpRequest {
  success: boolean;
  message: string;
  cooldownMinutes?: number;
  remainingRequests?: number;
}

interface OtpVerification {
  success: boolean;
  message: string;
  session?: any;
  user?: any;
}

interface PasswordResetRequest {
  newPassword: string;
  type: 'password_reset' | 'first_time_login';
}

interface PasswordResetResponse {
  success: boolean;
  message: string;
}

interface SignInResult {
  error: any;
  isFirstTimeLogin?: boolean;
  requiresPasswordReset?: boolean;
  isInActiveUser?: boolean;
}

interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
  initializeUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updatePassword: (
    request: PasswordResetRequest
  ) => Promise<PasswordResetResponse>;
  requestOtp: (email: string) => Promise<OtpRequest>;
  verifyOtp: (
    email: string,
    otp: string,
    isPasswordReset?: boolean
  ) => Promise<OtpVerification>;
  checkFirstTimeLogin: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [
    authUserWithProfile,
    setAuthUserWithProfile,
  ] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const initializeUser = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setAuthUserWithProfile(null);
        return;
      }

      // Fetch user profile
      const { data: authUserProfile, error } = await supabase
        .from('auth_users')
        .select(
          `
          *,
          profile:profiles(*)
        `
        )
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If we can't fetch the profile, clear both user and userProfile
        setAuthUserWithProfile(null);
        await signOut();
      } else {
        if (authUserProfile && authUserProfile.is_active === false) {
          await supabase.auth.signOut();
          setAuthUserWithProfile(null);
          return;
        }
        setSession(session);
        setAuthUserWithProfile(authUserProfile);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      setAuthUserWithProfile(null);
    }
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Check if user is active
    const userStatus = await isUserActive(data.user.id);
    if (!userStatus.userExists || !userStatus.isActive) {
      await signOut();
      return {
        error: null,
        isInActiveUser: true,
      };
    }

    if (data.user) {
      // set session state
      setSession(data.session);

      const isFirstTime = await checkFirstTimeLogin(data.user.id);

      // Check if this is a first-time login
      if (isFirstTime) {
        return {
          error: null,
          isFirstTimeLogin: true,
          requiresPasswordReset: true,
        };
      }

      // Reset OTP request count on successful login
      await resetOtpRequestCount(data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUserWithProfile(null);
    setSession(null);
  };

  const updatePassword = async (
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: request.newPassword,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      //set session state
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      // Mark user as no longer first-time
      if (data.user && request.type === 'first_time_login') {
        await supabase
          .from('auth_users')
          .update({
            is_first_login: false,
            password_updated: true,
            otp_requests_count: 0,
          })
          .eq('id', data.user.id);
      }

      // Reset OTP request count on successful login
      await resetOtpRequestCount(data.user.id);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Failed to reset password',
      };
    }
  };

  const requestOtp = async (email: string): Promise<OtpRequest> => {
    try {
      // Check if user exists and is active
      const userStatus = await isUserActive(undefined, email);
      if (!userStatus.userExists) {
        return {
          success: false,
          message:
            'No account found with this email address. Please check your email or contact your administrator.',
        };
      }
      if (!userStatus.isActive) {
        await signOut();
        return {
          success: false,
          message:
            'Your account is inactive. Please contact your administrator.',
        };
      }
      if (userStatus.error) {
        return {
          success: false,
          message: 'Unable to verify account status. Please try again later.',
        };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // For OTP requests, we need a valid user session or use anon key for unauthenticated requests
      const authHeader = accessToken
        ? `Bearer ${accessToken}`
        : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to send verification code',
          cooldownMinutes: result.cooldownMinutes,
          remainingRequests: result.remainingRequests,
        };
      }

      return {
        success: true,
        message: result.message || 'Verification email sent successfully',
        remainingRequests: result.remainingRequests,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Network error occurred',
      };
    }
  };

  const verifyOtp = async (
    email: string,
    otp: string
  ): Promise<OtpVerification> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // For OTP requests, we need a valid user session or use anon key for unauthenticated requests
      const authHeader = accessToken
        ? `Bearer ${accessToken}`
        : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to verify verification code',
        };
      }

      // If OTP verification is successful, use the session from backend
      if (!result.session) {
        return {
          success: false,
          message: 'No session found from server',
        };
      }

      // Set the session from the backend response
      await supabase.auth.setSession(result.session);
      setSession(result.session);

      // initialize user
      await initializeUser();

      return {
        success: true,
        message: result.message || 'Code verified successfully',
        session: result.session,
      };
    } catch (error) {
      return {
        success: false,
        message: (error as any).message || 'Error verifying OTP Code',
      };
    }
  };

  const checkFirstTimeLogin = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('is_first_login')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking first-time login:', error);
        return false;
      }

      return data?.is_first_login ?? false;
    } catch (error) {
      console.error('Error checking first-time login:', error);
      return false;
    }
  };

  const resetOtpRequestCount = async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('auth_users')
        .update({
          otp_requests_count: 0,
          last_login: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error resetting OTP request count:', error);
    }
  };

  const isUserActive = async (
    userId?: string,
    userEmail?: string
  ): Promise<{ isActive: boolean; userExists: boolean; error?: string }> => {
    try {
      let query = supabase.from('auth_users').select('is_active');

      if (userId) {
        query = query.eq('id', userId);
      } else if (userEmail) {
        query = query.eq('email', userEmail);
      } else {
        // If neither userId nor userEmail is provided
        return {
          isActive: false,
          userExists: false,
          error: 'No user identifier provided',
        };
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error checking user activity:', error);
        return {
          isActive: false,
          userExists: false,
          error: 'Database error occurred',
        };
      }

      // If no user found
      if (!data) {
        console.error('User not found in auth_users table');
        return { isActive: false, userExists: false };
      }

      return { isActive: data.is_active ?? false, userExists: true };
    } catch (error) {
      console.error('Error checking user activity:', error);
      return {
        isActive: false,
        userExists: false,
        error: 'Unexpected error occurred',
      };
    }
  };

  const value = {
    user: authUserWithProfile,
    session,
    initializeUser,
    signIn,
    signOut,
    updatePassword,
    requestOtp,
    verifyOtp,
    checkFirstTimeLogin,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
