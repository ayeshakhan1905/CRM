const request = require('supertest');
const app = require('../src/app');

let authToken;
let userId; // id of primary user


beforeAll(async () => {
  // register + login a user to get token
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Lead User', email: 'lead@example.com', password: 'Password1' });
  userId = regRes.body._id || regRes.body.id;

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'lead@example.com', password: 'Password1' });

  authToken = loginRes.body.token;
});

describe('Lead endpoints', () => {
  test('Create lead - validation fail (missing name)', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'no-name@example.com' });

    expect(res.statusCode).toBe(400);
  });

  test('Create lead - success', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Alice Smith', email: 'alice@example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', 'alice@example.com');
  });

  test('Create lead - assign to another user', async () => {
    // create second user
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Assignee', email: 'assignee@example.com', password: 'Password1' });
    const newUserId = reg.body._id || reg.body.id;

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bob', status: 'warm', assignedTo: newUserId });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('assignedTo');
    expect(res.body.assignedTo._id || res.body.assignedTo.id).toBe(newUserId);
  });

  test('Status validation (invalid value)', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Carol', status: 'freezing' });

    expect(res.statusCode).toBe(400);
  });

  test('Fetch leads owned by user', async () => {
    // create second user's lead
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'OtherLeadUser', email: 'otherlead@example.com', password: 'Password1' });
    const loginOther = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otherlead@example.com', password: 'Password1' });
    const otherToken = loginOther.body.token;

    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Zed' });

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.every(l => l.createdBy._id === userId || l.createdBy === userId)).toBe(true);
  });

  test('Update own lead', async () => {
    const create = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Editable Lead' });
    const leadId = create.body._id || create.body.id;

    const res = await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'hot' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'hot');
  });

  test('Cannot update someone else’s lead', async () => {
    // other user already created above
    const loginOther = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otherlead@example.com', password: 'Password1' });
    const otherToken = loginOther.body.token;

    const create = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Others Lead' });
    const otherLeadId = create.body._id || create.body.id;

    const res = await request(app)
      .put(`/api/leads/${otherLeadId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Hacked' });

    expect(res.statusCode).toBe(403);
  });
});
