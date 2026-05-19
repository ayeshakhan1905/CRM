const mongoose = require('mongoose');
require('dotenv').config();

const Deal = require('./src/models/dealModel');
const Customer = require('./src/models/customerModel');

async function testNormalization() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Testing API normalization logic...\n');

    let deals = await Deal.find({})
      .populate('customers', 'name email')
      .populate('customer', 'name email')
      .limit(1);
    
    console.log('Raw deal from DB:');
    console.log(JSON.stringify(deals[0], null, 2));
    
    // Apply the normalization from getDeals
    deals = deals.map(deal => {
      const dealObj = deal.toObject ? deal.toObject() : deal;
      if (dealObj.customer && !dealObj.customers?.length) {
        dealObj.customers = [dealObj.customer];
      }
      return dealObj;
    });

    console.log('\n\nNormalized deal (what API should return):');
    console.log(JSON.stringify(deals[0], null, 2));
    
    console.log('\n\nCustomers array:', deals[0].customers);
    console.log('Customer count:', deals[0].customers?.length);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testNormalization();
