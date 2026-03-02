const request = require('supertest');
const app = require('../src/app');

let userToken, otherToken;

beforeAll(async () => {
  const r1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'DashUser', email: 'dash@example.com', password: 'Password1' });
  const l1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'dash@example.com', password: 'Password1' });
  userToken = l1.body.token;

  const r2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'DashOther', email: 'dashother@example.com', password: 'Password1' });
  const l2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'dashother@example.com', password: 'Password1' });
  otherToken = l2.body.token;
});

describe('Dashboard endpoints', () => {
  test('Unauthorized access blocked', async () => {
    const res = await request(app).get('/api/dashboard/counts');
    expect(res.statusCode).toBe(401);
  });

  test('Returns aggregated stats and data is user-specific', async () => {
    // create a lead for main user
    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'DashLead' });

    // create another lead for other user
    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'OtherDashLead' });

    const res = await request(app)
      .get('/api/dashboard/counts')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('leads', 1);
  });
});
