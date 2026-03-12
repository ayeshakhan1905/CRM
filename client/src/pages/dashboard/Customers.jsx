// src/components/Customers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../redux/customerSlice";
import {
  createDeal,
  fetchDeals, // used to show deals under customer and refresh after create
} from "../../redux/dealSlice";
import { fetchStages } from "../../redux/stageSlice";
import { fetchUsers } from "../../redux/userSlice";
import { createTask, fetchTasks } from "../../redux/taskSlice";
import axios from "../../api/axios";
import {
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiSearch,
  FiUsers,
  FiMail,
  FiPhone,
  FiMapPin,
  FiX,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiActivity,
  FiFileText,
  FiTrendingUp,
  FiCheckSquare,
} from "react-icons/fi";
import Notes from "./Notes";

const Customers = () => {
  const dispatch = useDispatch();

  // --- Store selectors ---
  const { customers, loading: customersLoading } = useSelector(
    (state) => state.customers
  );
  const { deals, loading: dealsLoading } = useSelector((state) => state.deals);
  const {
    items: stages,
    loading: stagesLoading,
    error: stagesError,
  } = useSelector((state) => state.stages || { items: [] });
  const { items: users = [], loading: usersLoading } = useSelector((state) => state.users || { items: [] });
  const { tasks: allTasks = [] } = useSelector((state) => state.tasks || { tasks: [] });

  // --- Modal states ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  // --- Task Modal State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // --- Selected customer for view / deal creation ---
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // --- Customer form (add/edit) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
  });
  const [editId, setEditId] = useState(null);

  // --- Deal form (professional CRM style) ---
  const [dealForm, setDealForm] = useState({
    title: "",
    amount: "",
    stageId: "", // dropdown selection (stage._id)
    expectedCloseDate: "",
    probability: "", // %
    description: "",
  });

  // --- Task form ---
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });

  // --- Local UI state ---
  const [search, setSearch] = useState("");
  const [submittingDeal, setSubmittingDeal] = useState(false);

  // --- Initial loads ---
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchDeals());
    dispatch(fetchStages());
    dispatch(fetchUsers());
    dispatch(fetchTasks());
  }, [dispatch]);

  // --- Handlers: Customer ---
  const handleCustomerField = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddCustomer = () => {
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      location: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (editId) {
      dispatch(updateCustomer({ id: editId, customer: formData }));
    } else {
      dispatch(createCustomer(formData));
    }
    setIsModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      location: "",
    });
    setEditId(null);
  };

  const handleEditCustomer = (customer) => {
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      location: customer.location || "",
    });
    setEditId(customer._id);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm("Delete this customer?")) {
      dispatch(deleteCustomer(id));
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  // --- Handlers: Deals ---
  const openDealModal = (customer) => {
    setSelectedCustomer(customer);
    setDealForm({
      title: "",
      amount: "",
      stageId: "",
      expectedCloseDate: "",
      probability: "",
      description: "",
    });
    setIsDealModalOpen(true);
  };

  const handleDealField = (e) => {
    const { name, value } = e.target;
    setDealForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    // Basic validation (professional CRMs validate requireds)
    if (!dealForm.title || !dealForm.amount || !dealForm.stageId) {
      alert("Please fill Title, Amount and Stage.");
      return;
    }

    setSubmittingDeal(true);
    try {
      // Send both `amount` and `value` to be safe with your API
      await dispatch(
        createDeal({
          title: dealForm.title,
          amount: Number(dealForm.amount),
          value: Number(dealForm.amount),
          stage: dealForm.stageId, // backend expects stage id
          customer: selectedCustomer._id,
          closeDate: dealForm.expectedCloseDate || undefined,
          probability: dealForm.probability ? Number(dealForm.probability) : undefined,
          description: dealForm.description || undefined,
          status: "In Progress",
        })
      );
      // Refresh lists so the new deal shows immediately in the View modal's deals list
      dispatch(fetchDeals());
      setIsDealModalOpen(false);
      setDealForm({
        title: "",
        amount: "",
        stageId: "",
        expectedCloseDate: "",
        probability: "",
        description: "",
      });
    } finally {
      setSubmittingDeal(false);
    }
  };

  // --- Handlers: Tasks ---
  const handleTaskField = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (!taskForm.title) {
      alert("Please enter a task title.");
      return;
    }

    // build clean payload
    const payload = {
      title: taskForm.title,
      type: 'Customer',
      refId: selectedCustomer._id,
    };
    if (taskForm.description) payload.description = taskForm.description;
    if (taskForm.dueDate) payload.dueDate = taskForm.dueDate;
    if (taskForm.priority) payload.priority = taskForm.priority;
    if (taskForm.assignedTo) payload.assignedTo = taskForm.assignedTo;

    console.log('Customer task payload', payload);

    try {
      const result = await dispatch(createTask(payload));
      console.log('Customer task creation', result);
      if (result.error) console.error('Task creation failed', result.error);

      // re-fetch tasks for this customer
      if (selectedCustomer) {
        dispatch(fetchTasks({ relatedModel: 'Customer', relatedTo: selectedCustomer._id }));
      }

      // Notification is now handled by the server
      setIsTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "",
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // --- Derived/UI helpers ---
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.company]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, search]);

  const customerDeals = useMemo(() => {
    if (!selectedCustomer || !deals) return [];
    return deals.filter((d) => {
      const id = typeof d.customer === "object" ? d.customer?._id : d.customer;
      return id === selectedCustomer._id;
    });
  }, [deals, selectedCustomer]);

  // filter tasks for customer view
  const customerTasks = useMemo(() => {
    if (!selectedCustomer) return [];
    return allTasks.filter((task) => {
      const model = task.relatedModel?.toLowerCase?.() || task.type?.toLowerCase?.();
      const relatedId = task.relatedTo?._id || task.relatedTo || task.refId;
      const related = relatedId && String(relatedId) === String(selectedCustomer._id);
      console.log('Customer task filter', { task_id: task._id, model, related, relatedId, customerId: selectedCustomer._id });
      return model === "customer" && related;
    });
  }, [allTasks, selectedCustomer]);

  const stageOptions = useMemo(() => {
    const arr = Array.isArray(stages) ? [...stages] : [];
    return arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [stages]);

  const stageName = (stageId) => {
    const m = stageOptions.find((s) => s._id === stageId);
    return m?.name || "—";
  };

  const statusBadge = (status) => {
    const styles = {
      "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
      Won: "bg-green-50 text-green-700 border border-green-200",
      Lost: "bg-red-50 text-red-700 border border-red-200",
    };
    return styles[status] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const totalDealsValue = customerDeals.reduce((sum, deal) => sum + (deal.amount || deal.value || 0), 0);
  const wonDeals = customerDeals.filter(deal => deal.status === 'Won').length;

  const formFields = [
    { name: "name", icon: FiUsers, type: "text", required: true },
    { name: "email", icon: FiMail, type: "email", required: false },
    { name: "phone", icon: FiPhone, type: "tel", required: false },
    { name: "company", icon: FiMapPin, type: "text", required: false },
    { name: "location", icon: FiMapPin, type: "text", required: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiUsers className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Customer Management
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your customer relationships and deals
              </p>
            </div>
          </div>
          <button
            onClick={openAddCustomer}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="text-lg" />
            Add Customer
          </button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deals?.filter(d => d.status === 'In Progress').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiBriefcase className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Won Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deals?.filter(d => d.status === 'Won').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        {customersLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading customers...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {filteredCustomers?.map((customer) => (
                    <tr key={customer._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {customer.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email || "—"}</div>
                        <div className="text-sm text-gray-500">{customer.phone || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.company || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.location || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-150"
                            onClick={() => handleViewCustomer(customer)}
                            title="View Details"
                          >
                            <FiEye className="text-lg" />
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                            onClick={() => handleEditCustomer(customer)}
                            title="Edit Customer"
                          >
                            <FiEdit2 className="text-lg" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                            onClick={() => handleDeleteCustomer(customer._id)}
                            title="Delete Customer"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                          <button
                            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-150"
                            onClick={() => openDealModal(customer)}
                            title="Add Deal"
                          >
                            <FiBriefcase className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers?.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium">No customers found</p>
                          <p className="text-sm">Get started by adding your first customer.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editId ? "Edit Customer" : "Add New Customer"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {editId ? "Update customer information" : "Fill in the customer details below"}
              </p>
            </div>
            
            <form onSubmit={handleSubmitCustomer} className="p-6 space-y-6">
              {formFields.map((field) => (
                <div key={field.name} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <field.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={`Enter ${field.name}`}
                      value={formData[field.name]}
                      onChange={handleCustomerField}
                      required={field.required}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                    />
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  {editId ? "Update Customer" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced View Customer Modal */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                    <p className="text-gray-600">{selectedCustomer.company || "Individual Customer"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Customer Info Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FiMail className="text-blue-600" />
                      <span className="text-gray-700">{selectedCustomer.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiPhone className="text-blue-600" />
                      <span className="text-gray-700">{selectedCustomer.phone || "No phone provided"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiMapPin className="text-blue-600" />
                      <span className="text-gray-700">{selectedCustomer.location || "No location provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Deals:</span>
                      <span className="font-semibold text-gray-900">{customerDeals.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Won Deals:</span>
                      <span className="font-semibold text-green-600">{wonDeals}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span className="font-semibold text-gray-900">₹{totalDealsValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deals Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiBriefcase className="text-purple-600" />
                    Deals
                  </h3>
                  <button
                    onClick={() => openDealModal(selectedCustomer)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-md"
                  >
                    <FiPlus className="text-sm" />
                    Add Deal
                  </button>
                </div>
                
                {dealsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading deals...</span>
                  </div>
                ) : customerDeals?.length > 0 ? (
                  <div className="grid gap-4">
                    {customerDeals.map((deal) => (
                      <div key={deal._id} className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2">{deal.title}</h4>
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <FiDollarSign className="text-green-500" />
                                <span>₹{(deal.amount ?? deal.value ?? 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiActivity className="text-blue-500" />
                                <span>{typeof deal.stage === "object" ? deal.stage?.name : stageName(deal.stage)}</span>
                              </div>
                              {deal.closeDate && (
                                <div className="flex items-center gap-2">
                                  <FiCalendar className="text-purple-500" />
                                  <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge(deal.status || "In Progress")}`}>
                            {deal.status || "In Progress"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No deals yet</p>
                    <p className="text-sm">Create your first deal for this customer</p>
                  </div>
                )}
              </div>

              {/* Customer Tasks Section */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCheckSquare className="text-blue-600" />
                  Customer Tasks
                </h3>
                {customerTasks.length === 0 ? (
                  <p className="text-gray-500">No tasks for this customer.</p>
                ) : (
                  <ul className="space-y-3">
                    {customerTasks.map((task) => (
                      <li key={task._id} className="bg-white rounded-lg p-4 shadow flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{task.title}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-green-100 text-green-700" : task.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{task.status}</span>
                        </div>
                        {task.description && <p className="text-gray-600 text-sm">{task.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
                          <span>Priority: {task.priority}</span>
                          <span>Assigned: {task.assignedTo?.name || "Unassigned"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-2 mt-6 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md"
                >
                  <FiPlus className="text-sm" />
                  Create Task
                </button>
              </div>

              {/* Notes Section */}
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="text-amber-600" />
                  Notes
                </h3>
                <Notes relatedModel="Customer" relatedTo={selectedCustomer._id} />
              </div>

              {/* Activity Section */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="text-slate-600" />
                  Activity Timeline
                </h3>
                {Array.isArray(selectedCustomer.activities) && selectedCustomer.activities.length ? (
                  <div className="space-y-3">
                    {selectedCustomer.activities.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                        <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{activity}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FiActivity className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="font-medium">No activity recorded</p>
                    <p className="text-sm">Customer activity will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Add Deal Modal */}
      {isDealModalOpen && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FiBriefcase className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Deal</h2>
                  <p className="text-gray-600 text-sm">for {selectedCustomer.name}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleDealSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter deal title"
                    value={dealForm.title}
                    onChange={handleDealField}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="amount"
                      placeholder="0"
                      value={dealForm.amount}
                      onChange={handleDealField}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="stageId"
                    value={dealForm.stageId}
                    onChange={handleDealField}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 bg-white"
                  >
                    <option value="">
                      {stagesLoading
                        ? "Loading stages…"
                        : stagesError
                        ? "Failed to load stages"
                        : "Select stage"}
                    </option>
                    {stageOptions.map((stage) => (
                      <option key={stage._id} value={stage._id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Close Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="expectedCloseDate"
                      min={new Date().toISOString().split('T')[0]}
                      value={dealForm.expectedCloseDate}
                      onChange={handleDealField}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability (%)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPercent className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="probability"
                      placeholder="50"
                      value={dealForm.probability}
                      onChange={handleDealField}
                      min="0"
                      max="100"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Additional details about this deal..."
                  value={dealForm.description}
                  onChange={handleDealField}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingDeal ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    "Create Deal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && selectedCustomer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FiCheckSquare className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                  <p className="text-gray-600 text-sm">for {selectedCustomer.name}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  value={taskForm.title}
                  onChange={handleTaskField}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter task description"
                  value={taskForm.description}
                  onChange={handleTaskField}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  min={new Date().toISOString().split('T')[0]}
                  value={taskForm.dueDate}
                  onChange={handleTaskField}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskField}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To (User)</label>
                <select
                  name="assignedTo"
                  value={taskForm.assignedTo}
                  onChange={handleTaskField}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  <option value="">Select user</option>
                  {users && users.map((user) => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;