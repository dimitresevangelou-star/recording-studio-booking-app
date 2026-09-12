const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register({ fullName, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }

    // Public registration may only self-assign 'artist' or 'engineer'.
    // 'admin' (or any other value) is never accepted from the client.
    const safeRole = role === 'engineer' ? 'engineer' : 'artist';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      fullName,
      email,
      passwordHash,
      role: safeRole,
    });

    const token = this._generateToken(user);
    return { user, token };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const token = this._generateToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = new AuthService();
