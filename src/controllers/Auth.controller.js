const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('../utils/emailService');
const TempUser = require('../models/TempUser');
const Subscription = require('../models/Dashboard/Subscription');
const { assignFreePlanFromSubscriptionList } = require('../controllers/Stripe.controller');

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

    if (!user) return res.status(400).json({ message: 'User not exist!' });
    // 2. Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        isEmailVerified: false,
        email: user.email
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account blocked' });
    }




    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // 4. Check if blocked
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    // 5. Generate JWT
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

        // 6. Add admin data if applicable
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
  const { firstName, lastName, email, contact, nSiren, address, gender, password, role, currency } = req.body;

  try {
    // Check if user already exists in main User collection
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "L'utilisateur existe déjà" }); //User already exists
    }

    // Check if there's a pending verification
    let tempUser = await TempUser.findOne({ email });
    if (tempUser) {
      await TempUser.findOneAndDelete({ email });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create temporary user
    tempUser = new TempUser({
      firstName,
      lastName,
      email,
      contact,
      nSiren,
      currency,
      address: {
        streetNo: address.streetNo,
        streetName: address.streetName,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        countryCode: address.countryCode
      },
      gender: gender?.toUpperCase(),
      password: hashedPassword,
      role,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    await tempUser.save();
    // console.log(tempUser)

    // Send verification email
    try {
      const emailOptions = {
        to: email,
        subject: `Code de vérification`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Code de vérification</h2>
            <p>Bonjour ${firstName} ${lastName},</p>
            <p>Veuillez entrer le code de vérification ci-dessous pour terminer votre inscription:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p>Ce code expirera dans 15 minutes.</p>
            <p>Si vous n'avez pas demandé cette inscription, veuillez ignorer cet email ou contacter le support si vous avez des préoccupations.</p>
            <p style="color: #666; margin-top: 20px;">Cordialement,<br>L'équipe de votre application</p>
          </div>
        `
      };

      const emailServiceResult = await emailService.sendEmail(emailOptions.to, emailOptions);

      if (!emailServiceResult) {
        console.error("Échec de l'envoi de l'e-mail de vérification");
        await TempUser.findOneAndDelete({ email });
        return res.status(500).json({
          success: false,
          message: "Échec de l'envoi de l'e-mail de vérification" //Failed to send verification email
        });
      }

      res.status(201).json({
        success: true,
        message: 'Veuillez vérifier votre email pour terminer votre inscription',
        email: email
      });
    } catch (emailError) {
      console.error(emailError.message);
      await TempUser.findOneAndDelete({ email });
      return res.status(500).json({
        success: false,
        message: emailError.message || "Échec de l'envoi de l'e-mail de vérification" //Failed to send verification email
      });
    }


  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Erreur serveur' //Server error
    });
  }
};

// verify email
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: "Un code de vérification est requis" }); //Verification code is required
  }

  try {
    // Find temporary user
    const tempUser = await TempUser.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: "Un code de vérification invalide ou expiré" //Invalid or expired verification code
      });
    }

    // Create actual user
    const user = new User({
      firstName: tempUser.firstName,
      lastName: tempUser.lastName,
      email: tempUser.email,
      password: tempUser.password,
      contact: tempUser.contact,
      nSiren: tempUser.nSiren,
      currency: tempUser.currency,
      address: tempUser.address,
      countryCode: tempUser.countryCode,
      gender: tempUser.gender,
      role: tempUser.role,
      isEmailVerified: true,
      isSubscribed: false,
      subscription: {
        isActive: false
      }
    });
    await user.save();
    // Delete temporary user
    await TempUser.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      // data: user,
      message: "E-mail vérifié avec succès. Vous pouvez maintenant vous connecter.", //Email verified successfully. You can now log in.
      email: user.email
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' }); //User not found

    // 2. Generate 4-digit verification code (as shown in UI)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

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
        message: 'Code de vérification envoyé à votre e-mail'
      });
    } catch (emailError) {
      // If email fails, reset the user's verification code
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;
      await user.save();

      throw new Error('Échec de l\'envoi de l\'e-mail de vérification'); //Failed to send verification email
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erreur serveur' }); //Server error
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
      return res.status(400).json({ message: 'Code de vérification invalide ou expiré' }); //Invalid or expired verification code
    }

    res.json({
      success: true,
      message: 'Code vérifié avec succès',
      email: user.email // Send email back for the final step
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erreur serveur' }); //Server error
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  try {
    // 1. Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' }); //Passwords do not match
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' }); //User not found
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
      message: 'Mot de passe mis à jour avec succès' //Password updated successfully
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erreur serveur' }); //Server error
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: "Déconnexion réussie" }); //Logged out successfully
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur'); //Server error
  }
}   
