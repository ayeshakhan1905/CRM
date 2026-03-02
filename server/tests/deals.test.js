const request = require('supertest');
const app = require('../src/app');

let authToken;
let customerId;
let stageId;

beforeAll(async () => {
  // register + login
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Deal User', email: 'deal@example.com', password: 'Password1' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'deal@example.com', password: 'Password1' });

  authToken = loginRes.body.token;
});

describe('Deal endpoints', () => {
  test('Create deal - validation fail (missing title)', async () => {
    // create customer
    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Deal Customer', email: 'cust-deal@example.com' });
    const localCustomerId = custRes.body._id || custRes.body.id;

    // create stage as admin
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Stage Admin', email: 'stageadmin@example.com', password: 'Password1', role: 'admin' });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stageadmin@example.com', password: 'Password1' });
    const adminToken = adminLogin.body.token;
    const stageRes = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proposal', order: 1 });
    const localStageId = stageRes.body._id || stageRes.body.id;

    const res = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customer: localCustomerId, stage: localStageId, value: 1000 });

    expect(res.statusCode).toBe(400);
  });

  test('Create deal - success', async () => {
    // create customer
    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Deal Customer 2', email: 'cust-deal2@example.com' });
    const localCustomerId = custRes.body._id || custRes.body.id;

    // create stage as admin
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Stage Admin2', email: 'stageadmin2@example.com', password: 'Password1', role: 'admin' });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stageadmin2@example.com', password: 'Password1' });
    const adminToken = adminLogin.body.token;
    const stageRes = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proposal 2', order: 1 });
    const localStageId = stageRes.body._id || stageRes.body.id;

    const res = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Big Deal', customer: localCustomerId, stage: localStageId, value: 1500 });

    if (res.statusCode !== 201) console.log('Deal create failed:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('title', 'Big Deal');
  });

  test('Cannot create deal for other user’s customer', async () => {
    // create a customer as another user
    const other = await request(app)
      .post('/api/auth/register')
      .send({ name: 'OtherDealUser', email: 'otherdeal@example.com', password: 'Password1' });
    const loginOther = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otherdeal@example.com', password: 'Password1' });
    const otherToken = loginOther.body.token;

    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other User Cust', email: 'othercustdeal@example.com' });
    const otherCustomerId = custRes.body._id || custRes.body.id;

    // create stage as a fresh admin
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Stage Maker', email: 'stagemaker@example.com', password: 'Password1', role: 'admin' });
    const stageLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stagemaker@example.com', password: 'Password1' });
    const stageAdminToken = stageLogin.body.token;
    const stageRes2 = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${stageAdminToken}`)
      .send({ name: 'Stage X', order: 5 });
    const validStageId = stageRes2.body._id || stageRes2.body.id;


    const res = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Should Fail', customer: otherCustomerId, stage: validStageId, value: 200 });

    expect(res.statusCode).toBe(400);
  });

  test('Update deal stage', async () => {
    // create a deal first
    const custRes = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Stage Update Cust', email: 'stageupdate@example.com' });
    const custId = custRes.body._id || custRes.body.id;

    // create an admin to add the two stages
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'StageUpdater', email: 'stageupdateadmin@example.com', password: 'Password1', role: 'admin' });
    const stageAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'stageupdateadmin@example.com', password: 'Password1' });
    const stageAdminToken2 = stageAdminLogin.body.token;

    const stageA = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${stageAdminToken2}`)
      .send({ name: 'Stage A', order: 10 });
    const stageB = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${stageAdminToken2}`)
      .send({ name: 'Stage B', order: 11 });
    const stageAId = stageA.body._id || stageA.body.id;
    const stageBId = stageB.body._id || stageB.body.id;

    const dealRes = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'StageChangeDeal', customer: custId, stage: stageAId, value: 300 });
    const dealId = dealRes.body._id || dealRes.body.id;

    const updateRes = await request(app)
      .put(`/api/deals/${dealId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ stage: stageBId });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.stage._id || updateRes.body.stage.id).toBe(stageBId);
  });

  test('Mark deal won/lost', async () => {
    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Status Cust', email: 'statuscust@example.com' });
    const custId = cust.body._id || cust.body.id;
    // create stage via admin account
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'StatusAdmin', email: 'statusadmin@example.com', password: 'Password1', role: 'admin' });
    const adminLogin3 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'statusadmin@example.com', password: 'Password1' });
    const adminToken3 = adminLogin3.body.token;
    const stageRes3 = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken3}`)
      .send({ name: 'Status Stage', order: 20 });
    const stageId2 = stageRes3.body._id || stageRes3.body.id;

    const dealRes2 = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'WinLoseDeal', customer: custId, stage: stageId2, value: 500 });
    const dealId2 = dealRes2.body._id || dealRes2.body.id;

    const resWin = await request(app)
      .put(`/api/deals/${dealId2}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Won' });
    expect(resWin.statusCode).toBe(200);
    expect(resWin.body).toHaveProperty('status', 'Won');

    const resLost = await request(app)
      .put(`/api/deals/${dealId2}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Lost' });
    expect(resLost.statusCode).toBe(200);
    expect(resLost.body).toHaveProperty('status', 'Lost');
  });

  test('Cannot modify other user’s deal', async () => {
    // create another user and deal
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'DealBuyer', email: 'dealbuyer@example.com', password: 'Password1' });
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dealbuyer@example.com', password: 'Password1' });
    const otherToken2 = login2.body.token;

    const custOther = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${otherToken2}`)
      .send({ name: 'OtherDealCust', email: 'otherdealcust@example.com' });
    const custOtherId = custOther.body._id || custOther.body.id;

    // create stage for other deal via admin
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'OtherStageAdmin', email: 'otherstageadmin@example.com', password: 'Password1', role: 'admin' });
    const otherAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'otherstageadmin@example.com', password: 'Password1' });
    const otherAdminToken = otherAdminLogin.body.token;
    const stageOther = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${otherAdminToken}`)
      .send({ name: 'Other Stage', order: 30 });
    const stageOtherId = stageOther.body._id || stageOther.body.id;

    const otherDeal = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${otherToken2}`)
      .send({ title: 'OtherDeal', customer: custOtherId, stage: stageOtherId, value: 100 });
    const otherDealId = otherDeal.body._id || otherDeal.body.id;

    const res = await request(app)
      .put(`/api/deals/${otherDealId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Nope' });

    expect(res.statusCode).toBe(403);
  });
});
