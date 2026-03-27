exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
};