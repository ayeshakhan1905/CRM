const mongoose = require('mongoose');
require('dotenv').config();

const Deal = require('./src/models/dealModel');
const Customer = require('./src/models/customerModel');

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const deals = await Deal.find({})
      .populate('customers', 'name email')
      .populate('customer', 'name email')
      .limit(3);
    
    console.log('Sample deals with populated customers:');
    deals.forEach((deal, idx) => {
      console.log(`\nDeal ${idx + 1}: ${deal.title}`);
      console.log(`  Customer (old field):`, deal.customer);
      console.log(`  Customers (new array):`, deal.customers);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDB();