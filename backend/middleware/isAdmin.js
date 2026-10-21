// Dipasang setelah auth.js, khusus rute admin
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Khusus admin' });
};