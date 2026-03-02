const request = require('supertest');
const app = require('../src/app');

let authToken;

beforeAll(async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Note User', email: 'note@example.com', password: 'Password1' });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'note@example.com', password: 'Password1' });

  authToken = loginRes.body.token;
});

describe('Note endpoints', () => {
  test('Create note - validation fail (missing content)', async () => {
    // create lead for reference
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Note Lead', email: 'note-lead@example.com' });
    const localLeadId = leadRes.body._id || leadRes.body.id;

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ relatedModel: 'Lead', relatedTo: localLeadId });

    expect(res.statusCode).toBe(400);
  });

  test('Create note - success', async () => {
    // create lead for reference
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Note Lead 2', email: 'note-lead2@example.com' });
    const localLeadId = leadRes.body._id || leadRes.body.id;

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Important note', relatedModel: 'Lead', relatedTo: localLeadId });

    if (res.statusCode !== 201) console.log('Note create failed:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('content', 'Important note');
  });

  test('Fetch notes for entity', async () => {
    // create a new lead and attach a note
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'FetchLead' });
    const leadId = leadRes.body._id || leadRes.body.id;
    await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Note1', relatedModel: 'Lead', relatedTo: leadId });

    const res = await request(app)
      .get(`/api/notes?relatedModel=Lead&relatedTo=${leadId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Update own note', async () => {
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'UpdateLead' });
    const leadId = leadRes.body._id || leadRes.body.id;
    const noteCreate = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Original', relatedModel: 'Lead', relatedTo: leadId });
    const noteId = noteCreate.body._id || noteCreate.body.id;
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Edited' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('content', 'Edited');
  });

  test('Cannot update another user’s note', async () => {
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'NoteUser2', email: 'note2@example.com', password: 'Password1' });
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'note2@example.com', password: 'Password1' });
    const otherToken = login2.body.token;
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'TheirLead' });
    const leadId = leadRes.body._id || leadRes.body.id;
    const noteCreate = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ content: 'Their note', relatedModel: 'Lead', relatedTo: leadId });
    const noteId = noteCreate.body._id || noteCreate.body.id;
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hacked' });
    expect(res.statusCode).toBe(403);
  });

  test('Cannot create note for entity you don’t own', async () => {
    const reg3 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'LeadOwner', email: 'leadowner@example.com', password: 'Password1' });
    const login3 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'leadowner@example.com', password: 'Password1' });
    const otherToken2 = login3.body.token;
    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${otherToken2}`)
      .send({ name: 'OtherOwnedLead' });
    const leadId2 = leadRes.body._id || leadRes.body.id;
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Bad Note', relatedModel: 'Lead', relatedTo: leadId2 });
    expect(res.statusCode).toBe(403);
  });
});
