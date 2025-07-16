"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      // Do not navigate here; let useEffect handle redirect
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3fcfa] py-12 px-4">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mb-2">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">GSend</h1>
        <p className="text-gray-600 mt-1">Welcome back to your SMS marketing dashboard</p>
      </div>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900">Sign In</h2>
          <p className="text-center text-gray-500 text-sm mt-1">Enter your credentials to access your account</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.233.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.021 2.021A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10S1 6.477 1 12c0 1.657.336 3.233.938 4.675M4.222 4.222l15.556 15.556" /></svg>
                )}
              </button>
            </div>
            <div className="flex justify-between mt-1">
              <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">Forgot password?</Link>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-600 hover:text-emerald-500 font-medium">
            Sign up
          </Link>
        </div>
      </div>
      <p className="text-xs text-center text-gray-400 mt-6">
        By signing in, you agree to our{' '}
        <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a> and{' '}
        <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
      </p>
    </div>
  );
} 