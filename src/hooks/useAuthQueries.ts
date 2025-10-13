import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { AuthUserWithProfile } from '../types/user-management';

// Query keys for authentication
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: (userId?: string) => [...authKeys.all, 'user', userId] as const,
  userProfile: (userId: string) => [...authKeys.all, 'userProfile', userId] as const,
  userStatus: (userEmail?: string) => [...authKeys.all, 'userStatus', userEmail] as const,
  firstTimeLogin: (userId: string) => [...authKeys.all, 'firstTimeLogin', userId] as const,
};

// Hook to get current session
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always check on mount to prevent flickering
    retry: 1, // Reduce retry attempts for faster failure
    // Initialize with null instead of undefined to prevent flickering
    initialData: null,
    // Make the query synchronous on first load
    networkMode: 'always',
  });
}

// Hook to get user profile with auth data
export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: authKeys.userProfile(userId!),
    queryFn: async (): Promise<AuthUserWithProfile | null> => {
      if (!userId) return null;

      const { data: authUserProfile, error } = await supabase
        .from('auth_users')
        .select(`
          *,
          profile:profiles!auth_users_id_fkey1(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      return authUserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to check if user is active
export function useUserStatus(userEmail?: string) {
  return useQuery({
    queryKey: authKeys.userStatus(userEmail),
    queryFn: async (): Promise<{ isActive: boolean; userExists: boolean; error?: string }> => {
      try {
        let query = supabase.from('auth_users').select('is_active');

        if (userEmail) {
          query = query.eq('email', userEmail);
        } else {
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
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to check first time login status
export function useFirstTimeLogin(userId?: string) {
  return useQuery({
    queryKey: authKeys.firstTimeLogin(userId!),
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;

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
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation for signing in
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch session and user data
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      if (data.user?.id) {
        queryClient.invalidateQueries({ queryKey: authKeys.userProfile(data.user.id) });
        queryClient.invalidateQueries({ queryKey: authKeys.firstTimeLogin(data.user.id) });
        queryClient.invalidateQueries({ queryKey: authKeys.userStatus(data.user.id) });
      }
    },
  });
}

// Mutation for signing out
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

// Mutation for updating password
export function useUpdatePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      newPassword, 
      type
    }: { 
      newPassword: string; 
      type: 'password_reset' | 'first_time_login';
    }) => {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      // Mark user as no longer first-time if applicable
      if (data.user && type === 'first_time_login') {
        await supabase
          .from('auth_users')
          .update({
            is_first_login: false,
            password_updated: true,
            otp_requests_count: 0,
          })
          .eq('id', data.user.id);
      }

      // Reset OTP request count
      if (data.user?.id) {
        await supabase
          .from('auth_users')
          .update({
            otp_requests_count: 0,
            last_login: new Date().toISOString(),
          })
          .eq('id', data.user.id);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      if (data.user?.id) {
        queryClient.invalidateQueries({ queryKey: authKeys.userProfile(data.user.id) });
        queryClient.invalidateQueries({ queryKey: authKeys.firstTimeLogin(data.user.id) });
      }
    },
  });
}

// Mutation for requesting OTP
export function useRequestOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

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
        throw new Error(result.message || 'Failed to send verification code');
      }

      return result;
    },
  });
}

// Mutation for verifying OTP
export function useVerifyOtp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

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
        throw new Error(result.message || 'Failed to verify verification code');
      }

      if (!result.session) {
        throw new Error('No session found from server');
      }

      // Set the session from the backend response
      await supabase.auth.setSession(result.session);

      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch all auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

// Mutation for resetting OTP request count
export function useResetOtpRequestCount() {
  return useMutation({
    mutationFn: async (userId: string) => {
      await supabase
        .from('auth_users')
        .update({
          otp_requests_count: 0,
          last_login: new Date().toISOString(),
        })
        .eq('id', userId);
    },
  });
}