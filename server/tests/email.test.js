const request = require('supertest');
const app = require('../src/app');

// mock email service so we don't actually send messages
jest.mock('../src/services/emailService', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
  sendTemplate: jest.fn().mockResolvedValue({ messageId: 'tmpl' })
}));

let authToken;
beforeAll(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'EmailUser', email: 'email@example.com', password: 'Password1' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'email@example.com', password: 'Password1' });
  authToken = login.body.token;
});

describe('Email endpoints', () => {
  test('Send raw email - success', async () => {
    const res = await request(app)
      .post('/api/emails/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ to: 'recipient@test.com', subject: 'Hello', text: 'World' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Email sent');
  });

  test('Send raw email - validation error when email missing', async () => {
    const res = await request(app)
      .post('/api/emails/send')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ subject: 'Missing To', text: 'Nope' });
    expect(res.statusCode).toBe(400);
  });
});
