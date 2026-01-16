const express = require('express')
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require("../controllers/customerController.js");
const protect = require("../middleware/protect.js");
const checkOwnership = require('../middleware/checkOwnership.js');
const authorize = require('../middleware/authorize.js');
const logAction = require('../middleware/activityLog.js');
const Customer = require('../models/customerModel.js');

const router = express.Router();

router.route("/")
  .post(protect, logAction('Customer', 'created') , createCustomer)
  .get(protect, getCustomers);

router.route("/:id")
  .get(protect, getCustomerById)
  .put(protect,checkOwnership(Customer), logAction('Customer','updated') , updateCustomer)
  .delete(protect,authorize(['admin']), logAction('Customer' , 'deleted') , deleteCustomer);


module.exports = router
