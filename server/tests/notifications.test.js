const request = require('supertest');
const app = require('../src/app');

let userToken, userId, otherToken, otherId;

beforeAll(async () => {
  // create main user
  const res1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'NotifyUser', email: 'notify@example.com', password: 'Password1' });
  userId = res1.body._id || res1.body.id;
  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'notify@example.com', password: 'Password1' });
  userToken = login1.body.token;

  // create other user
  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'OtherNotify', email: 'othernotify@example.com', password: 'Password1' });
  otherId = res2.body._id || res2.body.id;
  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'othernotify@example.com', password: 'Password1' });
  otherToken = login2.body.token;
});

describe('Notification endpoints', () => {
  let noteId, noteId2;
  test('Fetch notifications for user', async () => {
    // create two notifications for user
    const r1 = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'First', message: 'hi' });
    const r2 = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Second', message: 'yo' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(2);
    // capture ids for later tests
    noteId = r1.body._id || r1.body.id;
    noteId2 = r2.body._id || r2.body.id;
  });

  test('Mark notification as read', async () => {
    // Create a fresh notification for this test
    const noteRes = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Read Me', message: 'please' });
    const testNoteId = noteRes.body._id || noteRes.body.id;

    const res = await request(app)
      .put(`/api/notifications/${testNoteId}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  test('Cannot access another user’s notifications', async () => {
    // create notification for other user using user endpoint (userId override)
    const otherNote = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'ForOther', message: 'nope', userId: otherId });
    const otherNoteId = otherNote.body._id || otherNote.body.id;

    // try marking as read with main user (should 401)
    const res = await request(app)
      .put(`/api/notifications/${otherNoteId}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(401);
  });
});
