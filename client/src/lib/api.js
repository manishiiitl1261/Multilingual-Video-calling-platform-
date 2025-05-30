const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = data.message || response.statusText;
    throw new Error(error);
  }
  
  return data;
};

// Register user
export const register = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  return handleResponse(response);
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });
  
  return handleResponse(response);
};

// Login user
export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  return handleResponse(response);
};

// Send login OTP
export const sendLoginOTP = async (email) => {
  const response = await fetch(`${API_URL}/api/auth/send-login-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  return handleResponse(response);
};

// Forgot password request
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    // Even if user not found, return a successful response for security
    if (response.status === 404) {
      return {
        success: true,
        emailSent: false,
        message: 'If your email exists in our system, you will receive a password reset link'
      };
    }
    
    if (!response.ok) {
      throw new Error(data.message || response.statusText);
    }
    
    return data;
  } catch (error) {
    console.error('Forgot password API error:', error);
    // Return a generic success message for security (prevents email enumeration)
    return {
      success: true,
      emailSent: false,
      message: 'If your email exists in our system, you will receive a password reset link'
    };
  }
};

// Reset password with token
export const resetPassword = async (resetToken, password) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/reset-password/${resetToken}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    return data;
  } catch (error) {
    console.error('Reset password API error:', error);
    throw error;
  }
};

// Get user profile
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return handleResponse(response);
};

// Update user profile
export const updateProfile = async (formData) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_URL}/api/auth/update-profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, // Using FormData to handle file uploads
  });
  
  return handleResponse(response);
};

// Logout user
export const logout = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: true };
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return handleResponse(response);
  } finally {
    // Always clear local storage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}; 