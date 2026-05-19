const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/userModel');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');
    const users = await User.find({});
    console.log('Users in database:');
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listUsers();
