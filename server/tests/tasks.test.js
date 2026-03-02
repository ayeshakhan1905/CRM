const request = require('supertest');
const app = require('../src/app');

let authToken;
let customerId;

beforeAll(async () => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Task User', email: 'task@example.com', password: 'Password1' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'task@example.com', password: 'Password1' });

  authToken = loginRes.body.token;

  // create a customer to attach task to
  const custRes = await request(app)
    .post('/api/customer')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Task Customer', email: `cust-task-${Date.now()}@example.com` });
  customerId = custRes.body._id || custRes.body.id;
  if (!customerId) {
    throw new Error('Failed to create customer in beforeAll: ' + JSON.stringify(custRes.body));
  }
});

describe('Task endpoints', () => {
  test('Create task - validation fail (missing title)', async () => {
    // create customer for reference
    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Task Customer', email: `cust-task-fail-${Date.now()}@example.com` });
    const localCustomerId = custRes.body._id || custRes.body.id;

    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'customer', refId: localCustomerId });

    expect(res.statusCode).toBe(400);
  });

  test('Create task - success', async () => {
    // create customer for reference
    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Task Customer 2', email: `cust-task-success-${Date.now()}@example.com` });
    const localCustomerId = custRes.body._id || custRes.body.id;

    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Follow up', type: 'customer', refId: localCustomerId });

    if (res.statusCode !== 201) console.log('Task create failed:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', 'Follow up');
  });

  test('Create task for lead and deal as well', async () => {
    // create a lead
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'LeadForTask' });
    const leadId = leadRes.body._id || leadRes.body.id;

    const dealCust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'DealCustForTask', email: `dealcusttask-${Date.now()}@example.com` });
    const dealCustId = dealCust.body._id || dealCust.body.id;
    // create stage needed for deal
    const stageAdminEmail = `stageadmintask-${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'StageAdminTask', email: stageAdminEmail, password: 'Password1', role: 'admin' });
    const stageLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: stageAdminEmail, password: 'Password1' });
    const stageToken = stageLogin.body.token;
    const stageRes = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${stageToken}`)
      .send({ name: 'DealStageTask', order: 99 });
    const stageId2 = stageRes.body._id || stageRes.body.id;
    const dealRes = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'TaskDeal', customer: dealCustId, stage: stageId2, value: 10 });
    const dealId = dealRes.body._id || dealRes.body.id;

    // create tasks for each type
    const types = [
      { type: 'lead', refId: leadId },
      { type: 'deal', refId: dealId }
    ];
    for (const t of types) {
      const r = await request(app)
        .post('/api/task')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Multi', ...t });
      expect(r.statusCode).toBe(201);
    }
  });

  test('Task assigned to another user', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'TaskAssignee', email: `taskassignee-${Date.now()}@example.com`, password: 'Password1' });
    const assigneeId = reg.body._id || reg.body.id;
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Assigned Task', type: 'customer', refId: customerId, assignedTo: assigneeId });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('assignedTo');
    expect(res.body.assignedTo._id || res.body.assignedTo.id).toBe(assigneeId);
  });

  test('Update task status', async () => {
    const create = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'StatusTask', type: 'customer', refId: customerId });
    const taskId = create.body._id || create.body.id;
    const res = await request(app)
      .put(`/api/task/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in-progress' }); // Use valid enum value
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'in-progress');
  });

  test('Cannot update another user’s task', async () => {
    const otherEmail = `othertask-${Date.now()}@example.com`;
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'OtherTaskUser', email: otherEmail, password: 'Password1' });
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: otherEmail, password: 'Password1' });
    const otherToken = login2.body.token;
    const create = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Their Task', type: 'customer', refId: customerId });
    const taskId = create.body._id || create.body.id;
    const res = await request(app)
      .put(`/api/task/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Nope' });
    expect(res.statusCode).toBe(403);
  });

  test('Invalid refId results in 400', async () => {
    const res = await request(app)
      .post('/api/task')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'BadRef', type: 'customer', refId: '123' });
    expect(res.statusCode).toBe(400);
  });
});
