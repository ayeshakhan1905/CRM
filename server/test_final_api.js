const mongoose = require('mongoose');
require('dotenv').config();

const Deal = require('./src/models/dealModel');
const Customer = require('./src/models/customerModel');
const Stage = require('./src/models/stageModel');
const Lead = require('./src/models/leadModel');
const Note = require('./src/models/noteModel');
const User = require('./src/models/userModel');
const Task = require('./src/models/taskModel');

// Simulate the exact getDeals function logic
async function testGetDealsAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Simulating /api/deals endpoint...\n');

    // This is the exact logic from dealsController.getDeals()
    const baseQuery = {};  // Admin user sees all deals
    let query = { ...baseQuery };

    let deals = await Deal.find(query)
      .populate("customers", "name email")
      .populate("customer", "name email")  // Populate old field too
      .populate("stage", "name order")
      .populate("lead", "name email")
      .populate("notes", "content createdAt")
      .populate("createdBy", "name email")
      .populate("tasks", "title status priority dueDate");
    
    // Normalize deals: convert old format (customer) to new format (customers)
    deals = deals.map(deal => {
      const dealObj = deal.toObject ? deal.toObject() : deal;
      if (dealObj.customer && !dealObj.customers?.length) {
        dealObj.customers = [dealObj.customer];
      }
      return dealObj;
    });

    console.log(`API Response: ${deals.length} deals\n`);
    
    if (deals.length > 0) {
      const deal = deals[0];
      console.log(`Deal: ${deal.title}`);
      console.log(`Customers in response:`, deal.customers);
      console.log(`Customer count: ${deal.customers?.length || 0}`);
      
      if (deal.customers && deal.customers.length > 0) {
        console.log('\nCustomer details:');
        deal.customers.forEach((c, idx) => {
          console.log(`  ${idx + 1}. Name: ${c.name}, Email: ${c.email}`);
        });
      }
      
      console.log('\n✅ Frontend should receive:');
      console.log(`   - deal.customers array with ${deal.customers?.length} customer(s)`);
      console.log(`   - Each customer has: name="${deal.customers[0]?.name}", email="${deal.customers[0]?.email}"`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testGetDealsAPI();
