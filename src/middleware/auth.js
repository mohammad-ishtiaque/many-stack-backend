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
exports.adminAuth = (roles = ['admin', 'superadmin']) => (req, res, next) => {
  // 1. Check authentication
  if (!req.user) return res.status(401).json({ message: 'Authorization denied' });
  
  // 2. Check admin role
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Superadmin-specific middleware
exports.superadminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};