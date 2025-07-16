import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqepkvpydmdrlfbtuadh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZXBrdnB5ZG1kcmxmYnR1YWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMjExODQsImV4cCI6MjA2NTc5NzE4NH0.KNcZT-7lvbHmlAusUiNagOTkjEiGORvfD6UusehNrfs';

// Create a singleton instance to prevent multiple client instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
})();

// Auth helper functions
export async function signUp(email: string, password: string) {
  console.log('🔍 Testing signUp with email:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  console.log('🔍 Supabase signUp raw response:', { data, error });
  return { data, error };
}

export async function testExistingEmail(email: string, password: string) {
  console.log('🧪 Testing existing email signup for:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  console.log('🧪 Test result:', { 
    hasData: !!data, 
    hasUser: !!data?.user, 
    hasSession: !!data?.session,
    error: error ? { message: error.message, status: error.status } : null 
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  return { data, error };
} 