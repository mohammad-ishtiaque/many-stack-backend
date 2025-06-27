const jwt = require('jsonwebtoken');
// User authentication middleware


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




exports.userAuth = (req, res, next) => {
  // 1. Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  // console.log(token)
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    // 2. Verify tokenAA
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin authentication middleware
exports.adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  // console.log(token)
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin rights required'
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Superadmin authentication middleware
exports.superAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin rights required'
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin or Superadmin authentication middleware
exports.adminOrSuperAdminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded.user;
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Superadmin rights required'
      });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
