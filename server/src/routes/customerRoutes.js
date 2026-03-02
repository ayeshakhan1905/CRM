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
const { validateCreateCustomer, validateUpdateCustomer, validateId } = require('../middleware/validation');

const router = express.Router();

router.route("/")
  .post(protect, validateCreateCustomer, logAction('Customer', 'created') , createCustomer)
  .get(protect, getCustomers);

router.route("/:id")
  .get(protect, validateId, getCustomerById)
  .put(protect, validateUpdateCustomer, checkOwnership(Customer), logAction('Customer','updated') , updateCustomer)
  // owner or admin allowed to delete
  .delete(protect, validateId, checkOwnership(Customer), logAction('Customer' , 'deleted') , deleteCustomer);


module.exports = router
