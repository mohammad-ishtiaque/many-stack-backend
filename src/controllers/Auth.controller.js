const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('../utils/emailService');

// Unified login for users and admins
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {

    // 1. Check in Admin schema first
    let admin = await Admin.findOne({ email });
    
    if (admin) {
      // Admin login flow
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const payload = {
        user: {
          id: admin.id,
          role: admin.role
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '400h' },
        (err, token) => {
          if (err) throw err;
          
          // Update last login
          admin.lastLogin = new Date();
          admin.save();

          res.json({
            token,
            user: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role,
              permissions: admin.permissions
            }
          });
        }
      );
      return;
    }
    // 1. Check user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // 3. Check if blocked
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    // 4. Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '400h' },
      (err, token) => {
        if (err) throw err;
        
        // 5. Add admin data if applicable
        if (user.role !== 'user') {
          Admin.findOne({ user: user.id })
            .then(admin => {
              res.json({
                token,
                user: {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  role: user.role,
                  permissions: admin?.permissions
                }
              });
            });
        } else {
          res.json({
            token,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role
            }
          });
        }
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// User registration
exports.register = async (req, res) => {
  const { firstName, lastName, email,contact, nSiren, address, gender, password, role } = req.body;

  try {
    // 1. Check user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // 2. Create user
    user = new User({ firstName, lastName, email, contact, nSiren, address, gender: gender?.toUpperCase(), password, role });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save user
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });

    // 5. Generate JWT (similar to login)
    // ... (same JWT generation as login)

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Generate 4-digit verification code (as shown in UI)
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Save code to user with expiry (15 minutes)
    user.resetCode = verificationCode;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // 4. Send verification code via email
    try {
      await emailService.sendOTP(
        email, 
        verificationCode, 
        `${user.firstName} ${user.lastName}`
      );

      res.json({ 
        success: true,
        message: 'Verification code sent to your email'
      });
    } catch (emailError) {
      // If email fails, reset the user's verification code
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;
      await user.save();

      throw new Error('Failed to send verification email');
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// Step 2: Verify the code
exports.verifyCode = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    res.json({ 
      success: true,
      message: 'Code verified successfully',
      email: user.email // Send email back for the final step
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    // 1. Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // 4. Clear reset code fields
    user.resetCode = undefined;
    user.resetCodeExpires = undefined; 
    
    // 5. Save user
    await user.save();

    res.json({ 
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}   
