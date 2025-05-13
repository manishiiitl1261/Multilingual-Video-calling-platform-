import React, { useState, useEffect } from "react";
import { register, verifyOTP } from "@/lib/api";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otpFormData, setOtpFormData] = useState({
    email: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fallbackOtp, setFallbackOtp] = useState("");
  const [isOtpVerification, setIsOtpVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationTimestamp, setVerificationTimestamp] = useState(null);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (e) => {
    setOtpFormData({ ...otpFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFallbackOtp("");
    setIsLoading(true);

    try {
      const { fullName, email, password, confirmPassword } = formData;

      // Basic validation
      if (!fullName || !email || !password || !confirmPassword) {
        setError("All fields are required.");
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        setIsLoading(false);
        return;
      }

      // Register API call
      const response = await register({
        name: fullName,
        email,
        password,
      });

      // Set OTP verification state
      setIsOtpVerification(true);
      setOtpFormData(prev => ({ ...prev, email }));
      setVerificationTimestamp(Date.now());

      // Check if email was sent successfully
      if (response.emailSent) {
        setSuccess("Registration successful! Please check your email for verification OTP.");
      } else {
        // If email failed, show OTP directly on screen
        setFallbackOtp(response.otp);
        setSuccess("Email delivery failed. Please use the OTP displayed below:");
      }

      // Enable resend cooldown
      setResendDisabled(true);
      setCountdown(60);
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
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
      // Re-register with the same details to get a new OTP
      const response = await register({
        name: formData.fullName,
        email: otpFormData.email,
        password: formData.password,
      });

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

      // Redirect to home page directly
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
    <div
      className="flex items-center justify-center min-h-screen bg-center bg-cover"
    >
      <div className="w-full max-w-md p-8 bg-white shadow-xl bg-opacity-90 rounded-2xl">
        <h2 className="mb-6 text-2xl font-semibold text-center text-blue-800">
          {isOtpVerification ? "Verify Email" : "Create Account"}
        </h2>

        {error && <div className="mb-4 text-sm text-red-500">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-500">{success}</div>}

        {fallbackOtp && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 font-medium">Your OTP: <span className="font-bold">{fallbackOtp}</span></p>
            <p className="text-xs text-yellow-600 mt-1">This is only displayed because the email delivery failed.</p>
          </div>
        )}

        {isOtpVerification ? (
          // OTP verification form
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Enter the OTP sent to your email
              </label>
              <input
                type="text"
                name="otp"
                value={otpFormData.otp}
                onChange={handleOtpChange}
                className="w-full px-4 py-2 text-black placeholder-blue-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
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
              className={`w-full px-4 py-2 font-semibold text-white transition duration-200 rounded-xl ${isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          // Sign up form
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 text-black placeholder-blue-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 text-black placeholder-blue-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-black placeholder-blue-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a password"
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-sm cursor-pointer text-blue-500 hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 text-black placeholder-blue-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-2 font-semibold text-white transition duration-200 rounded-xl ${isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-center text-gray-500">
          Already have an account?{" "}
          <a href="/Login" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
