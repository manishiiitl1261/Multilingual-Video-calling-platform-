import React, { useState, useEffect } from 'react';
import { forgotPassword } from '@/lib/api';
import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle auto-redirect after success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigateToLogin();
    }
  }, [success, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Simple validation
      if (!email) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      // Call API to send reset link
      const response = await forgotPassword(email);
      
      if (response.emailSent) {
        setSuccess('A password reset link has been sent to your email');
      } else {
        setSuccess('If your email exists in our system, you will receive a password reset link');
      }
      // Start countdown for auto-redirect
      setCountdown(5);
    } catch (error) {
      // Don't show specific errors to prevent email enumeration
      console.error('Forgot password error:', error);
      setSuccess('If your email exists in our system, you will receive a password reset link');
      // Start countdown for auto-redirect
      setCountdown(5);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/Login');
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-100 text-red-700 p-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 bg-green-100 text-green-700 p-3 rounded">
                <p>{success}</p>
                <p className="mt-2">
                  <button 
                    onClick={navigateToLogin}
                    className="text-green-600 font-medium hover:underline"
                  >
                    Return to login {countdown > 0 && `(auto-redirect in ${countdown}s)`}
                  </button>
                </p>
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <p className="mb-4 text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-800">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={navigateToLogin}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors inline-flex items-center"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 ${isLoading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-md transition-colors`}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 