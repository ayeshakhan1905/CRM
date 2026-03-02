const request = require('supertest');
const app = require('../src/app');

let authToken;

beforeAll(async () => {
  // Register
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cust User', email: 'custtest@example.com', password: 'Password1' });

  // Login and extract token from response
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'custtest@example.com', password: 'Password1' });
  
  authToken = loginRes.body.token;
});

describe('Customer endpoints', () => {
  test('Create customer - validation fail (missing name)', async () => {
    const res = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'no-name@example.com' });

    expect(res.statusCode).toBe(400);
  });

  test('Create customer - success', async () => {
    const res = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Acme Corp', email: 'newcust2@example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', 'newcust2@example.com');
  });

  test('Fetch only own customers', async () => {
    // create a second user and their customer
    const other = await request(app)
      .post('/api/auth/register')
      .send({ name: 'OtherCust', email: 'othercust@example.com', password: 'Password1' });
    const loginOther = await request(app)
      .post('/api/auth/login')
      .send({ email: 'othercust@example.com', password: 'Password1' });
    const otherToken = loginOther.body.token;

    await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Other Corp', email: 'othercorp@example.com' });

    const res = await request(app)
      .get('/api/customer')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    // should not include othercorp
    expect(res.body.every(c => c.email !== 'othercorp@example.com')).toBe(true);
  });

  test('Update own customer', async () => {
    const create = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updatable Corp', email: 'update@example.com' });
    const custId = create.body._id || create.body.id;

    const res = await request(app)
      .put(`/api/customer/${custId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Name');
  });

  test('Delete own customer', async () => {
    const create = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Deletable Corp', email: 'delete@example.com' });
    const custId = create.body._id || create.body.id;

    const res = await request(app)
      .delete(`/api/customer/${custId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Cannot update another user’s customer (403)', async () => {
    // set up other user and their customer
    const other = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Owner2', email: 'owner2@example.com', password: 'Password1' });
    const loginOther = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner2@example.com', password: 'Password1' });
    const otherToken = loginOther.body.token;

    const cust = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Their Corp', email: 'their@example.com' });
    const otherCustId = cust.body._id || cust.body.id;

    const res = await request(app)
      .put(`/api/customer/${otherCustId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Illicit' });

    expect(res.statusCode).toBe(403);
  });

  test('Cannot delete another user’s customer (403)', async () => {
    // create a fresh other user/customer for deletion test
    const another = await request(app)
      .post('/api/auth/register')
      .send({ name: 'DeleteOwner', email: 'deleteowner@example.com', password: 'Password1' });
    const loginAnother = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deleteowner@example.com', password: 'Password1' });
    const anotherToken = loginAnother.body.token;

    const cust2 = await request(app)
      .post('/api/customer')
      .set('Authorization', `Bearer ${anotherToken}`)
      .send({ name: 'Their Corp 2', email: 'their2@example.com' });
    const otherCustId2 = cust2.body._id || cust2.body.id;

    const res = await request(app)
      .delete(`/api/customer/${otherCustId2}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(403);
  });
});
