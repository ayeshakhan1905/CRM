const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');

describe('Auth endpoints', () => {
  test('Register - success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'testuser@example.com', password: 'Password1' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', 'testuser@example.com');
    const user = await User.findOne({ email: 'testuser@example.com' });
    expect(user).not.toBeNull();
  });

  test('Register - validation fail (missing email)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Email', password: 'Password1' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  test('Login - success', async () => {
    // create user first
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email: 'login@example.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password1' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'login@example.com');
  });

  test('Login - invalid password', async () => {
    // ensure user exists
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User2', email: 'login2@example.com', password: 'Password1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@example.com', password: 'wrongpass' });

    // controller now returns 401 for invalid credentials
    expect(res.statusCode).toBe(401);
  });

  test('Register - invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'Password1' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  test('Protected route without token should return 401', async () => {
    const res = await request(app)
      .get('/api/customer')
      .send();
    expect(res.statusCode).toBe(401);
  });

  test('Protected route with invalid token should return 401', async () => {
    const res = await request(app)
      .get('/api/customer')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});
