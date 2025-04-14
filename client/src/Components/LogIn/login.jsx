import React, { useState, useEffect } from "react";
import { login, verifyOTP, sendLoginOTP } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [otpFormData, setOtpFormData] = useState({
    email: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fallbackOtp, setFallbackOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpVerification, setIsOtpVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Effect for OTP resend countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOtpChange = (e) => {
    setOtpFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFallbackOtp("");
    setIsLoading(true);
    
    try {
      const { email, password } = formData;

      // Simple Validation
      if (!email || !password) {
        setError("All fields are required!");
        setIsLoading(false);
        return;
      }

      // Login API call
      const response = await login({ email, password });
      
      if (response.requiresVerification) {
        // Set OTP verification mode
        setIsOtpVerification(true);
        setOtpFormData(prev => ({ ...prev, email }));
        
        // Check if email was sent successfully
        if (response.emailSent) {
          setSuccess("Please verify your email with the OTP sent to your email address.");
        } else {
          // If email failed, show OTP directly on screen
          setFallbackOtp(response.otp);
          setSuccess("Email delivery failed. Please use the OTP displayed below:");
        }
        
        // Enable resend cooldown
        setResendDisabled(true);
        setCountdown(60);
      } else {
        // Save user data and token
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        setSuccess("Login successful! Redirecting...");
        
        // Redirect to home page
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendDisabled) return;
    
    setError("");
    setSuccess("");
    setFallbackOtp("");
    setIsLoading(true);
    
    try {
      // Request a new OTP
      const response = await sendLoginOTP(otpFormData.email);
      
      if (response.emailSent) {
        setSuccess("A new OTP has been sent to your email.");
      } else {
        setFallbackOtp(response.otp);
        setSuccess("Email delivery failed. Please use the new OTP displayed below:");
      }
      
      // Enable resend cooldown
      setResendDisabled(true);
      setCountdown(60);
    } catch (error) {
      setError(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    
    try {
      const { email, otp } = otpFormData;

      // Simple Validation
      if (!email || !otp) {
        setError("All fields are required!");
        setIsLoading(false);
        return;
      }

      // Verify OTP API call
      const response = await verifyOTP(email, otp);
      
      // Save user data and token
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      setSuccess("Verification successful! Redirecting to home page...");
      
      // Redirect to home page
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      setError(error.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-xl">
        <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">
          {isOtpVerification ? "Verify OTP" : "Login"}
        </h2>

        {error && (
          <div className="px-4 py-2 mb-4 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-2 mb-4 text-green-700 bg-green-100 rounded">
            {success}
          </div>
        )}
        
        {fallbackOtp && (
          <div className="px-4 py-2 mb-4 text-yellow-800 bg-yellow-100 rounded">
            <p className="font-medium">Your OTP: <span className="font-bold">{fallbackOtp}</span></p>
            <p className="text-xs text-yellow-700 mt-1">This is only displayed because the email delivery failed.</p>
          </div>
        )}

        {isOtpVerification ? (
          // OTP verification form
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Enter the OTP sent to your email
              </label>
              <input
                type="text"
                name="otp"
                id="otp"
                value={otpFormData.otp}
                onChange={handleOtpChange}
                className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Didn't receive the OTP?
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendDisabled}
                  className={`text-xs ${resendDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:underline'}`}
                >
                  {resendDisabled 
                    ? `Resend in ${countdown}s` 
                    : 'Resend OTP'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 text-white transition-all rounded-md ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          // Login form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 mt-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 pr-12 mt-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute text-sm text-blue-600 transform -translate-y-1/2 right-2 top-1/2 hover:underline focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 text-white transition-all rounded-md ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <a href="/SignUp" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
