const request = require('supertest');
const app = require('../src/app');

let userToken, adminToken;

beforeAll(async () => {
  // regular user
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'ReportUser', email: 'report@example.com', password: 'Password1' });
  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'report@example.com', password: 'Password1' });
  userToken = login1.body.token;

  // admin user
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'ReportAdmin', email: 'reportadmin@example.com', password: 'Password1', role: 'admin' });
  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'reportadmin@example.com', password: 'Password1' });
  adminToken = login2.body.token;
});

describe('Report endpoints', () => {
  test('Generates report for own data', async () => {
    // create a lead and a deal
    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'RepLead' });

    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'RepCust', email: 'repcust@example.com' });
    const custId = cust.body._id || cust.body.id;

    // stage by admin
    await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'RepStage', order: 1 });
    const stgList = await request(app)
      .get('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`);
    const stageId = stgList.body.find(s => s.name === 'RepStage')._id;

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'RepDeal', customer: custId, stage: stageId, value: 100 });

    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('totalLeads');
  });

  test('Date filters work on report', async () => {
    const res = await request(app)
      .get('/api/reports?range=7d')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test('Non-admin cannot access /reports/users', async () => {
    const res = await request(app)
      .get('/api/reports/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Admin can access /reports/users', async () => {
    const res = await request(app)
      .get('/api/reports/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});