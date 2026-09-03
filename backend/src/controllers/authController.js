const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email and password are required' });
    }
    const { user, token } = await authService.register({ fullName, email, password, role });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const { user, token } = await authService.login({ email, password });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
