/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/api";
import Navbar from "@/Components/Navbar/Navbar";
import Footer from "@/Components/Footer/Footer";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle automatic redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigateToLogin();
    }
  }, [success, countdown]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const getTokenFromUrl = () => {
    if (typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      return pathArray[pathArray.length - 1];
    }
    return "";
  };

  const navigateToLogin = () => {
    router.push("/Login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Simple validation
      if (!password || !confirmPassword) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        setIsLoading(false);
        return;
      }

      const resetToken = getTokenFromUrl();

      if (!resetToken) {
        setError("Invalid reset token");
        setIsLoading(false);
        return;
      }

      // Call API to reset password
      await resetPassword(resetToken, password);
      setSuccess(
        "Your password has been reset successfully. You can now login with your new password."
      );

      // Clear form and start countdown
      setPassword("");
      setConfirmPassword("");
      setCountdown(5);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(
        error.message ||
          "Failed to reset password. The link may be invalid or expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
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
                    Go to Login{" "}
                    {countdown > 0 && `(auto-redirect in ${countdown}s)`}
                  </button>
                </p>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <p className="mb-4 text-gray-600">
                    Enter your new password below.
                  </p>

                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block mb-2 text-sm font-medium text-gray-800"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute text-sm text-purple-600 transform -translate-y-1/2 right-2 top-1/2 hover:underline focus:outline-none"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="block mb-2 text-sm font-medium text-gray-800"
                    >
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
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
                    className={`px-6 py-2 ${
                      isLoading
                        ? "bg-purple-400"
                        : "bg-purple-600 hover:bg-purple-700"
                    } text-white rounded-md transition-colors`}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
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
