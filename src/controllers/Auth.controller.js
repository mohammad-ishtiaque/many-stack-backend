const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Unified login for users and admins
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
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
  const { firstName, lastName, email,contact, nSiren, address, gender, password } = req.body;

  try {
    // 1. Check user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // 2. Create user
    user = new User({ firstName, lastName, email, contact, nSiren, address, gender, password });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save user
    await user.save();

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
    if (!user) return res.status(400).json({ message: 'User not found' });

    // 2. Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save code to user with expiry (15 minutes)
    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // 4. Send response (in real app, send email instead)
    res.json({ message: 'Reset code sent', code: resetCode });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;

  try {
    // 1. Find user with this reset code and valid expiry
    const user = await User.findOne({
      resetCode: code,
      resetCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // 3. Clear reset code and expiry
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    
    // 4. Save user
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
