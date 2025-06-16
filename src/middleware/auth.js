const jwt = require('jsonwebtoken');


// General authentication middleware
exports.auth = (req, res, next) => {
  // 1. Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin-specific middleware
exports.adminAuth = async (req, res, next) => {
    try {
        // Check if user exists (from auth middleware)x
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin rights required'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Admin authorization failed'
        });
    }
};

// Superadmin-specific middleware
exports.superadminAuth = (req, res, next) => {
    
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    console.log('User role:', req.user ? req.user.role : 'No user');
    return res.status(403).json({ message: 'Superadmin access required' });
  }

  next();
};


exports.adminOrSuperadmin = (req, res, next) => {
  // Assuming req.user is populated by the auth middleware
  const role = req.user && req.user.role;
  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Access forbidden' });
};


