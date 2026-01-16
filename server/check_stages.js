const mongoose = require('mongoose');
const Stage = require('./src/models/stageModel');

mongoose.connect('mongodb://localhost:27017/crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const stages = await Stage.find({});
  console.log('Total stages:', stages.length);
  stages.forEach(stage => console.log('Stage:', stage._id, stage.name));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});