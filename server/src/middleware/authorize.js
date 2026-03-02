// middleware/authorize.js
const authorize = (roles = []) => {
  // roles can be a single role string or an array
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // if no roles specified, allow any authenticated user
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = authorize;