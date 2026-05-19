const request = require('supertest');
const app = require('../src/app');

let userToken, userId, otherUserId, otherToken, adminToken;

beforeAll(async () => {
  // create primary user
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Primary User', email: 'primary@example.com', password: 'Password1' });
  userId = res1.body._id || res1.body.id;
  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'primary@example.com', password: 'Password1' });
  userToken = login1.body.token;

  // create a second normal user
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Other User', email: 'other@example.com', password: 'Password1' });
  otherUserId = res2.body._id || res2.body.id;
  const login2b = await request(app)
    .post('/api/auth/login')
    .send({ email: 'other@example.com', password: 'Password1' });
  otherToken = login2b.body.token;

  // create admin user
  const res3 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin User', email: 'admin@example.com', password: 'Password1', role: 'admin' });
  const login3 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'Password1' });
  adminToken = login3.body.token;
});

describe('User endpoints', () => {
  test('Get own profile', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'primary@example.com');
  });

  test('Update own profile', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Primary Updated' });

    expect(res.statusCode).toBe(200);
    // response is wrapped in { message, user }
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('name', 'Primary Updated');
  });

  test('Sales user can fetch all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Admin can fetch all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // there should be at least 3 users we created
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test("User cannot update another user's profile", async () => {
    const res = await request(app)
      .put(`/api/users/${otherUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacked Name' });

    expect(res.statusCode).toBe(403);
  });

  test('Admin can fetch activity summary for a user', async () => {
    // create some activity under otherUserId as that user
    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'ActivityLead' });

    const res = await request(app)
      .get(`/api/users/${otherUserId}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('leadsAdded');
    expect(typeof res.body.leadsAdded).toBe('number');
    expect(res.body).toHaveProperty('leadsConverted');
    expect(res.body).toHaveProperty('customersAdded');
    expect(res.body).toHaveProperty('dealsAdded');
  });
});
