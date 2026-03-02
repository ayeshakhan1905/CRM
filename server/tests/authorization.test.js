const request = require('supertest');
const app = require('../src/app');

describe('Authorization and ownership rules', () => {
  let adminToken, user1Token, user2Token;

  beforeAll(async () => {
    // admin
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'authz_admin@example.com', password: 'Password1', role: 'admin' });
    const ares = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authz_admin@example.com', password: 'Password1' });
    adminToken = ares.body.token;

    // user1
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'User One', email: 'authz_user1@example.com', password: 'Password1' });
    const r1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authz_user1@example.com', password: 'Password1' });
    user1Token = r1.body.token;

    // user2
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'User Two', email: 'authz_user2@example.com', password: 'Password1' });
    const r2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authz_user2@example.com', password: 'Password1' });
    user2Token = r2.body.token;

  });

  test('Stage creation forbidden for non-admin', async () => {
    const res = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Should Fail', order: 5 });
    expect(res.statusCode).toBe(403);
  });

  test('Customer update blocked for other user', async () => {
    // user1 creates a customer
    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Authz Cust', email: 'authz_cust@example.com' });
    const customerId = cust.body._id || cust.body.id;

    const res = await request(app)
      .put(`/api/customer/${customerId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked' });
    expect(res.statusCode).toBe(403);
  });

  test('Deal deletion blocked for other user', async () => {
    // prepare resources
    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Authz Cust', email: 'authz_cust@example.com' });
    const customerId = cust.body._id || cust.body.id;

    const stage = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Authz Stage', order: 1 });
    const stageId = stage.body._id || stage.body.id;

    const deal = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Authz Deal', customer: customerId, stage: stageId, value: 100 });
    const dealId = deal.body._id || deal.body.id;

    const res = await request(app)
      .delete(`/api/deals/${dealId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.statusCode).toBe(403);
  });

  test('Task deletion blocked for other user', async () => {
    // create customer & task as user1
    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Authz Cust', email: 'authz_cust@example.com' });
    const customerId = cust.body._id || cust.body.id;

    const task = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Authz Task', type: 'customer', refId: customerId });
    const taskId = task.body._id || task.body.id;

    const res = await request(app)
      .delete(`/api/task/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);
    expect(res.statusCode).toBe(403);
  });

  test('Admin can delete other user deal', async () => {
    // setup new deal as user1
    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Authz Cust', email: 'authz_cust@example.com' });
    const customerId = cust.body._id || cust.body.id;

    const stage = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Authz Stage', order: 1 });
    const stageId = stage.body._id || stage.body.id;

    const deal = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Authz Deal', customer: customerId, stage: stageId, value: 100 });
    const dealId = deal.body._id || deal.body.id;

    const res = await request(app)
      .delete(`/api/deals/${dealId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});