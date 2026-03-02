const request = require('supertest');
const app = require('../src/app');

let authToken;

beforeAll(async () => {
  // register as admin because stage routes require admin role
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Stage User', email: 'stage@example.com', password: 'Password1', role: 'admin' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'stage@example.com', password: 'Password1' });

  authToken = loginRes.body.token;
});

describe('Stage endpoints', () => {
  test('Create stage - validation fail (missing name)', async () => {
    const res = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ order: 2 });

    expect(res.statusCode).toBe(400);
  });

  test('Create stage - success', async () => {
    const res = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Negotiation', order: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Negotiation');
  });

  test('Non-admin cannot create stage', async () => {
    // register a non-admin user
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'StageNonAdmin', email: 'stagenon@example.com', password: 'Password1' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stagenon@example.com', password: 'Password1' });
    const nonToken = login.body.token;
    const res = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${nonToken}`)
      .send({ name: 'ShouldFail', order: 99 });
    expect(res.statusCode).toBe(403);
  });

  test('Admin can update stage', async () => {
    // first create stage
    const create = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'UpdStage', order: 5 });
    const id = create.body._id || create.body.id;
    const res = await request(app)
      .put(`/api/stages/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ order: 10 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('order', 10);
  });

  test('Non-admin cannot update stage', async () => {
    // Create a stage first (as admin)
    const create = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'UpdStageNonAdmin', order: 8 });
    const stageId = create.body._id || create.body.id;

    // login as non-admin again
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stagenon@example.com', password: 'Password1' });
    const nonToken = login.body.token;
    
    // try to update the stage as non-admin
    const res = await request(app)
      .put(`/api/stages/${stageId}`)
      .set('Authorization', `Bearer ${nonToken}`)
      .send({ name: 'Bad' });
    expect(res.statusCode).toBe(403);
  });

  test('Stages return sorted by order', async () => {
    // create few stages with specific order
    await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Order1', order: 100 });
    await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Order2', order: 50 });
    const res = await request(app)
      .get('/api/stages')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    const orders = res.body.map(s => s.order);
    const sorted = [...orders].sort((a,b)=>a-b);
    expect(orders).toEqual(sorted);
  });
});
