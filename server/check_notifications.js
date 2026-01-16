const mongoose = require('mongoose');
const Notification = require('./src/models/notificationModel');

mongoose.connect('mongodb://localhost:27017/crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const notifications = await Notification.find({});
  console.log('Total notifications:', notifications.length);
  notifications.forEach(notification => console.log('Notification:', notification._id, notification.title, 'user:', notification.user));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});