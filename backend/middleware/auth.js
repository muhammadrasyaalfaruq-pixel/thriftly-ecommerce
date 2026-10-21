const jwt = require('jsonwebtoken');

// Dipasang di rute yang butuh login
module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Harus login dulu' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // isinya { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
};