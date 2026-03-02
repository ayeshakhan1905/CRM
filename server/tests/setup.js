const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set dummy env vars for testing
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.IMAGEKIT_PUBLIC_KEY = 'test_public_key';
process.env.IMAGEKIT_PRIVATE_KEY = 'test_private_key';
process.env.IMAGEKIT_URL_ENDPOINT = 'https://test.imagekit.io';
process.env.NODE_ENV = 'test';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    // Skip collections needed for cross-test data
    // Users and Customers are used in beforeAll and shared across individual tests
    if (!['users', 'customers'].includes(key)) {
      await collections[key].deleteMany({});
    }
  }
});
