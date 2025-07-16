"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, signIn, signUp as supabaseSignUp, signOut, getSession, resetPassword as supabaseResetPassword, updatePassword as supabaseUpdatePassword } from '@shared/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userFullName: string;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState<string>("User");

  // Fetch user's full name from the database
  const fetchUserName = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      if (data && typeof data.full_name === 'string' && data.full_name) {
        setUserFullName(data.full_name);
        console.log('Fetched user full name:', data.full_name);
      } else if (error) {
        console.log('Failed to fetch user full name:', error);
      }
    } catch (error) {
      console.log('Error fetching user full name:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUserName(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUserName(session.user.id);
      } else {
        setUserFullName("User");
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    userFullName,
    signIn: async (email: string, password: string) => {
      const { error } = await signIn(email, password);
      return { error };
    },
    signUp: async (email: string, password: string, fullName: string) => {
      console.log('Starting sign up process for:', email);
      
      // First check if user already exists in our users table
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (existingUser && !checkError) {
          console.log('User already exists in database:', existingUser.email);
          return { 
            error: { 
              message: 'An account with this email already exists. Please sign in instead.',
              status: 400 
            } 
          };
        }
      } catch (e) {
        console.log('Error checking existing user:', e);
        // Continue with signup if check fails
      }
      
      const { data, error } = await supabaseSignUp(email, password);
      console.log('Supabase signUp response:', { 
        data: data ? { 
          user: data.user ? { 
            id: data.user.id, 
            email: data.user.email,
            email_confirmed_at: data.user.email_confirmed_at,
            created_at: data.user.created_at
          } : null,
          session: data.session ? 'session exists' : null
        } : null, 
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null 
      });
      
      if (error) {
        // Provide user-friendly error messages
        let userFriendlyError = error.message;
        
        if (error.message?.includes('already registered') || 
            error.message?.includes('already been registered') ||
            error.message?.includes('already in use') ||
            error.message?.includes('User already registered')) {
          userFriendlyError = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message?.includes('Invalid email')) {
          userFriendlyError = 'Please enter a valid email address.';
        } else if (error.message?.includes('Password')) {
          userFriendlyError = 'Password must be at least 6 characters long.';
        } else if (error.message?.includes('rate limit')) {
          userFriendlyError = 'Too many sign up attempts. Please try again later.';
        }
        
        console.log('Returning user-friendly error:', userFriendlyError);
        return { error: { ...error, message: userFriendlyError } };
      }
      
      // Check if user was actually created
      if (!data?.user) {
        console.log('No user created despite no error - likely already exists');
        return { 
          error: { 
            message: 'An account with this email already exists. Please sign in instead.',
            status: 400 
          } 
        };
      }
      
      if (data?.user) {
        console.log('User created successfully, inserting into users table');
        try {
          await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email,
                full_name: fullName,
              }
            ]);
          console.log('User inserted into users table successfully');
        } catch (e: any) {
          console.error('Error inserting user into users table:', e);
          
          // If it's a 409 Conflict (unique constraint violation), the user already exists
          if (e.code === '23505' || e.status === 409 || e.message?.includes('duplicate key') || e.message?.includes('already exists')) {
            console.log('User already exists in database');
            return { 
              error: { 
                message: 'An account with this email already exists. Please sign in instead.',
                status: 400 
              } 
            };
          }
          
          // For other database errors
          return { 
            error: { 
              message: 'Failed to create account. Please try again.',
              status: 500 
            } 
          };
        }
      }
      
      console.log('Sign up completed successfully');
      return { error: null };
    },
    signOut: async () => {
      const { error } = await signOut();
      return { error };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabaseResetPassword(email);
      return { error };
    },
    updatePassword: async (newPassword: string) => {
      const { error } = await supabaseUpdatePassword(newPassword);
      return { error };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 