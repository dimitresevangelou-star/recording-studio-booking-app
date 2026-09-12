jest.mock('../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../src/repositories/userRepository');
const authService = require('../src/services/authService');

describe('authService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    jwt.sign.mockReturnValue('fake-jwt-token');
  });

  it('throws 409 when the email is already registered', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'taken@example.com' });

    await expect(
      authService.register({
        fullName: 'Test User',
        email: 'taken@example.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('hashes the password and creates the user when the email is free', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    userRepository.create.mockResolvedValue({
      id: 1,
      full_name: 'Test User',
      email: 'new@example.com',
      role: 'artist',
    });

    const { user, token } = await authService.register({
      fullName: 'Test User',
      email: 'new@example.com',
      password: 'password123',
      role: 'artist',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed-password' })
    );
    expect(user.email).toBe('new@example.com');
    expect(token).toBe('fake-jwt-token');
  });

  it('SECURITY: ignores a client-supplied role of "admin" and registers as artist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    userRepository.create.mockImplementation((data) => Promise.resolve({ id: 1, ...data }));

    await authService.register({
      fullName: 'Hacker',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'artist' })
    );
  });

  it('allows self-registration as engineer', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    userRepository.create.mockImplementation((data) => Promise.resolve({ id: 1, ...data }));

    await authService.register({
      fullName: 'Engineer',
      email: 'engineer@example.com',
      password: 'password123',
      role: 'engineer',
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'engineer' })
    );
  });
});

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    jwt.sign.mockReturnValue('fake-jwt-token');
  });

  it('throws 401 when the email does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'ghost@example.com', password: 'whatever' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when the password is incorrect', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns a user and token on successful login', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed-password',
      role: 'artist',
    });
    bcrypt.compare.mockResolvedValue(true);

    const { user, token } = await authService.login({
      email: 'test@example.com',
      password: 'correct-password',
    });

    expect(user.password_hash).toBeUndefined(); // should never leak the hash
    expect(token).toBe('fake-jwt-token');
  });
});
