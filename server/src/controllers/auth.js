const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists but is not verified, allow re-registration attempt
            if (!user.isVerified) {
                // Generate new OTP
                const otp = user.generateOTP();
                user.name = name; // Update name if different
                user.password = password; // This will trigger the pre-save hook to hash
                await user.save();

                // Send OTP email
                const verificationEmail = `
                    <h1>Email Verification</h1>
                    <p>Hello ${user.name},</p>
                    <p>Thank you for registering with Clarity Connect. Please use the following OTP to verify your email address:</p>
                    <h2>${otp}</h2>
                    <p>This OTP will expire in 15 minutes.</p>
                    <p>If you did not request this verification, please ignore this email.</p>
                    <p>Regards,<br>Clarity Connect Team</p>
                `;

                let emailSent = true;
                try {
                    await sendEmail({
                        to: user.email,
                        subject: 'Email Verification - Clarity Connect',
                        text: verificationEmail
                    });
                    console.log(`OTP email sent to ${user.email} with OTP: ${otp}`);
                } catch (emailError) {
                    console.error('Failed to send email:', emailError);
                    emailSent = false;
                }

                // Return response with OTP information
                return res.status(200).json({
                    success: true,
                    message: 'We sent a new verification code. Please check your email.',
                    emailSent,
                    // Include OTP in response if email failed (for development/testing only)
                    ...(process.env.NODE_ENV !== 'production' && !emailSent && { otp }),
                    email: user.email
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists and is verified'
                });
            }
        }

        // Create user with isVerified set to false
        user = await User.create({
            name,
            email,
            password,
            isVerified: false // Explicitly mark as unverified
        });

        // Generate OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        const verificationEmail = `
            <h1>Email Verification</h1>
            <p>Hello ${user.name},</p>
            <p>Thank you for registering with Clarity Connect. Please use the following OTP to verify your email address:</p>
            <h2>${otp}</h2>
            <p>This OTP will expire in 15 minutes.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Regards,<br>Clarity Connect Team</p>
        `;

        let emailSent = true;
        try {
            await sendEmail({
                to: user.email,
                subject: 'Email Verification - Clarity Connect',
                text: verificationEmail
            });
            console.log(`OTP email sent to ${user.email} with OTP: ${otp}`);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            emailSent = false;
        }

        // Return response with OTP information
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification OTP.',
            emailSent,
            // Include OTP in response if email failed (for development/testing only)
            ...(process.env.NODE_ENV !== 'production' && !emailSent && { otp }),
            email: user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if OTP matches and is not expired
        if (!user.otp || !user.otp.code || user.otp.code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (user.otp.expiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        // Send response with token
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            // Generate new OTP for login
            const otp = user.generateOTP();
            await user.save();

            // Send OTP email
            const loginOtpEmail = `
                <h1>Login Verification</h1>
                <p>Hello ${user.name},</p>
                <p>Please use the following OTP to complete your login process:</p>
                <h2>${otp}</h2>
                <p>This OTP will expire in 15 minutes.</p>
                <p>If you did not attempt to login, please change your password immediately.</p>
                <p>Regards,<br>Clarity Connect Team</p>
            `;

            let emailSent = true;
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Login Verification - Clarity Connect',
                    text: loginOtpEmail
                });
                console.log(`Login OTP email sent to ${user.email} with OTP: ${otp}`);
            } catch (emailError) {
                console.error('Failed to send login OTP email:', emailError);
                emailSent = false;
            }

            return res.status(200).json({
                success: true,
                message: 'Please verify your email. An OTP has been sent to your email address.',
                requiresVerification: true,
                emailSent,
                // Include OTP in response if email failed (for development/testing only)
                ...(process.env.NODE_ENV !== 'production' && !emailSent && { otp }),
                email: user.email
            });
        }

        // Send response with token
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Send OTP for login verification
// @route   POST /api/auth/send-login-otp
// @access  Public
exports.sendLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        const loginOtpEmail = `
            <h1>Login Verification</h1>
            <p>Hello ${user.name},</p>
            <p>Please use the following OTP to complete your login process:</p>
            <h2>${otp}</h2>
            <p>This OTP will expire in 15 minutes.</p>
            <p>If you did not attempt to login, please change your password immediately.</p>
            <p>Regards,<br>Clarity Connect Team</p>
        `;

        let emailSent = true;
        try {
            await sendEmail({
                to: user.email,
                subject: 'Login Verification - Clarity Connect',
                text: loginOtpEmail
            });
            console.log(`Login OTP email sent to ${user.email} with OTP: ${otp}`);
        } catch (emailError) {
            console.error('Failed to send login OTP email:', emailError);
            emailSent = false;
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            emailSent,
            // Include OTP in response if email failed (for development/testing only)
            ...(process.env.NODE_ENV !== 'production' && !emailSent && { otp })
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, removeProfilePicture } = req.body;
        const updatedFields = {};

        // Check what fields to update
        if (name) updatedFields.name = name;

        // If profile picture was uploaded
        if (req.file) {
            updatedFields.profilePicture = req.file.filename;
        }
        
        // If user wants to remove profile picture
        if (removeProfilePicture === 'true') {
            updatedFields.profilePicture = 'default';
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updatedFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    });
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    // Calculate expiration date properly
    const expiresIn = parseInt(process.env.JWT_EXPIRE) || 7; // Default to 7 days if not provided
    const expirationDate = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
    
    const options = {
        expires: expirationDate,
        httpOnly: true
    };

    // Use secure cookie in production
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            }
        });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });

        // For security, don't reveal if user exists or not
        // Just proceed if user exists, return same response either way
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(20).toString('hex');

            // Hash token and set to resetPasswordToken field
            user.resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Set token expiration (10 minutes)
            user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

            await user.save();

            // Create reset url
            const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

            // Create email message
            const message = `
                <h1>Password Reset Request</h1>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6b46c1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
                <p>Regards,<br>Clarity Connect Team</p>
            `;

            let emailSent = true;
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Password Reset - Clarity Connect',
                    text: message
                });
            } catch (error) {
                console.error('Failed to send password reset email:', error);
                emailSent = false;
                
                // Remove reset tokens if email fails
                user.resetPasswordToken = undefined;
                user.resetPasswordExpire = undefined;
                await user.save();
            }

            return res.status(200).json({
                success: true,
                message: 'Password reset email sent',
                emailSent
            });
        }

        // If user doesn't exist, return success but with emailSent = false
        // This way we don't leak info about which emails exist in our database
        return res.status(200).json({
            success: true,
            message: 'If your email exists in our system, you will receive a password reset link',
            emailSent: false
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        // Find user by token
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Validate password
        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        if (req.body.password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save();

        // Send confirmation email
        const message = `
            <h1>Password Reset Successful</h1>
            <p>Hello ${user.name},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not request this change, please contact our support team immediately.</p>
            <p>Regards,<br>Clarity Connect Team</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Successful - Clarity Connect',
                text: message
            });
        } catch (error) {
            console.error('Failed to send password reset confirmation email:', error);
            // Continue anyway, as the password has been reset
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}; 