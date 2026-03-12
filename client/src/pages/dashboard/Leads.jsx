import React from 'react'
import Loading from "../Loading";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLeads,
  addLead,
  updateLead,
  deleteLead,
  convertLead,
  clearError,
} from "../../redux/leadSlice";
import { fetchUsers } from "../../redux/userSlice";
import { createTask, fetchTasks } from "../../redux/taskSlice";
import { toast } from "react-toastify";
import axios from "../../api/axios";
import socketService from "../../services/socketService";
import {
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiTrendingUp,
  FiThermometer,
  FiUser,
  FiMail,
  FiPhone,
  FiX,
  FiSearch,
  FiFilter,
  FiFileText,
  FiActivity,
  FiTarget,
  FiZap,
  FiCheckSquare,
} from "react-icons/fi";
import Notes from "./Notes";

export default function Leads() {
  const dispatch = useDispatch();
  const { items: leads, loading, error } = useSelector((state) => state.leads);
  const { items: users = [], loading: usersLoading } = useSelector((state) => state.users || { items: [] });
  const { tasks: allTasks = [] } = useSelector((state) => state.tasks || { tasks: [] });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLead, setSelectedLead] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "warm",
  });

  // --- Task Modal State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });

  useEffect(() => {
    dispatch(fetchLeads());
    dispatch(fetchUsers());
    dispatch(fetchTasks()); // Ensure tasks are loaded
  }, [dispatch]);

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", status: "warm" });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async () => {
    try {
      await dispatch(addLead(formData)).unwrap();
      resetForm();
      setErrorMessage("");
      setShowAddModal(false);
      toast.success("Lead added successfully");
    } catch (err) {
      setErrorMessage(err || "Failed to add lead");
    }
  };

  const handleEdit = async () => {
    if (!selectedLead) return;
    try {
      await dispatch(updateLead({ id: selectedLead._id, data: formData })).unwrap();
      resetForm();
      setErrorMessage("");
      setSelectedLead(null);
      setShowEditModal(false);
      toast.success("Lead updated successfully");
    } catch (err) {
      setErrorMessage(err || "Failed to update lead");
    }
  };

  const handleDelete = () => {
    if (!selectedLead) return;
    dispatch(deleteLead(selectedLead._id)).then(() => {
      setSelectedLead(null);
      setShowDeleteModal(false);
      toast.success("Lead deleted successfully");
    }).catch(() => {
      toast.error("Failed to delete lead");
    });
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      status: lead.status || "warm",
    });
    setErrorMessage("");
    setShowEditModal(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "hot":
        return FiTrendingUp;
      case "cold":
        return FiThermometer;
      case "warm":
      default:
        return FiThermometer;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      hot: "bg-red-50 text-red-700 border border-red-200",
      warm: "bg-orange-50 text-orange-700 border border-orange-200",
      cold: "bg-blue-50 text-blue-700 border border-blue-200",
    };
    return styles[status] || styles.warm;
  };

  const getStatusColor = (status) => {
    const colors = {
      hot: "text-red-500",
      warm: "text-orange-500",
      cold: "text-blue-500",
    };
    return colors[status] || colors.warm;
  };

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(search.toLowerCase()) ||
                         lead.phone?.includes(search);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const leadStats = {
    total: leads?.length || 0,
    hot: leads?.filter(l => l.status === "hot").length || 0,
    warm: leads?.filter(l => l.status === "warm").length || 0,
    cold: leads?.filter(l => l.status === "cold").length || 0,
  };

  const formFields = [
    { name: "name", type: "text", icon: FiUser, placeholder: "Enter full name", required: true },
    { name: "email", type: "email", icon: FiMail, placeholder: "Enter email address", required: false },
    { name: "phone", type: "tel", icon: FiPhone, placeholder: "Enter phone number", required: false },
  ];

  const handleTaskField = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!taskForm.title) {
      alert("Please enter a task title.");
      return;
    }
    try {
      const payload = {
        ...taskForm,
        type: 'Lead',
        refId: selectedLead._id,
      };
      if (!taskForm.assignedTo) {
        delete payload.assignedTo;
      }
      const result = await dispatch(createTask(payload)).unwrap();

      // Create notification for the assigned user
      // Notification is now handled by the server

      setIsTaskModalOpen(false);
      setTaskForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "",
      });
      toast.success("Task created successfully");
    } catch (err) {
      toast.error("Failed to create task");
    }
  };

  // Filter tasks for selected lead
  const leadTasks = selectedLead ? allTasks.filter(
    (task) => (
      (task.relatedModel?.toLowerCase?.() === "lead" || task.type?.toLowerCase?.() === "lead") &&
      (task.relatedTo === selectedLead._id || task.refId === selectedLead._id)
    )
  ) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiTrendingUp className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Lead Management
                </h1>
                <p className="text-gray-600 mt-1">Track and nurture your sales prospects</p>
              </div>
            </div>
            <button
              onClick={() => {
                dispatch(clearError());
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="text-lg" />
              Add New Lead
            </button>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Leads</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{leadStats.total}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Hot Leads</p>
                  <p className="text-2xl lg:text-3xl font-bold text-red-600">{leadStats.hot}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-red-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Warm Leads</p>
                  <p className="text-2xl lg:text-3xl font-bold text-orange-600">{leadStats.warm}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FiThermometer className="text-orange-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Cold Leads</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600">{leadStats.cold}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiThermometer className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search leads by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200 bg-white min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="hot">Hot Leads</option>
                <option value="warm">Warm Leads</option>
                <option value="cold">Cold Leads</option>
              </select>
            </div>
          </div>

          {/* Enhanced Leads Table */}
          {filteredLeads.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/60">
                    {filteredLeads.map((lead) => {
                      const StatusIcon = getStatusIcon(lead.status);
                      return (
                        <tr key={lead._id} className="hover:bg-orange-50/30 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {lead.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                <div className="flex items-center gap-1 mt-1">
                                  <StatusIcon className={`text-sm ${getStatusColor(lead.status)}`} />
                                  <span className="text-xs text-gray-500 capitalize">{lead.status} lead</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {lead.email && (
                                <div className="flex items-center gap-2">
                                  <FiMail className="text-gray-400 text-sm" />
                                  <span className="text-sm text-gray-900">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center gap-2">
                                  <FiPhone className="text-gray-400 text-sm" />
                                  <span className="text-sm text-gray-900">{lead.phone}</span>
                                </div>
                              )}
                              {!lead.email && !lead.phone && (
                                <span className="text-gray-400 text-sm">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                              <StatusIcon className="text-sm" />
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openViewModal(lead)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                                title="View Details"
                              >
                                <FiEye className="text-lg" />
                              </button>
                              <button
                                onClick={() => openEditModal(lead)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-150"
                                title="Edit Lead"
                              >
                                <FiEdit2 className="text-lg" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                                title="Delete Lead"
                              >
                                <FiTrash2 className="text-lg" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to convert ${lead.name} to a customer?`)) {
                                    try {
                                      await dispatch(convertLead(lead._id)).unwrap();
                                      toast.success("Lead converted to customer successfully");
                                    } catch (err) {
                                      toast.error(err || "Failed to convert lead");
                                    }
                                  }
                                }}
                                className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-150"
                                title="Convert to Customer"
                              >
                                <FiTarget className="text-lg" />
                              </button>
                              
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
              <div className="text-gray-500">
                <FiTrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Found</h3>
                <p className="text-gray-600 mb-6">
                  {search || statusFilter !== "all"
                    ? "No leads match your current filters."
                    : "Get started by adding your first lead."}
                </p>
                {(search || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <FiPlus className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Lead</h2>
                    <p className="text-gray-600 text-sm">Create a new sales prospect</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMessage("");
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {errorMessage && (
                <div className="bg-red-50/80 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiX className="text-red-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              {formFields.map((field) => (
                <div key={field.name}>
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
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Temperature <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200 bg-white"
                >
                  <option value="hot">🔥 Hot - Ready to buy</option>
                  <option value="warm">🌡️ Warm - Interested</option>
                  <option value="cold">❄️ Cold - Initial contact</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMessage("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setErrorMessage("");
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <FiEdit2 className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Lead</h2>
                    <p className="text-gray-600 text-sm">Update lead information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {errorMessage && (
                <div className="bg-red-50/80 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiX className="text-red-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Error</h3>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              {formFields.map((field) => (
                <div key={field.name}>
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
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Temperature <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200 bg-white"
                >
                  <option value="hot">🔥 Hot - Ready to buy</option>
                  <option value="warm">🌡️ Warm - Interested</option>
                  <option value="cold">❄️ Cold - Initial contact</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedLead) {
                      setFormData({
                        name: selectedLead.name || "",
                        email: selectedLead.email || "",
                        phone: selectedLead.phone || "",
                        status: selectedLead.status || "warm",
                      });
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Update Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-red-600 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Lead</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedLead?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced View Lead Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    {selectedLead?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedLead?.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedLead?.status)}`}>
                        {React.createElement(getStatusIcon(selectedLead?.status), { className: "text-sm" })}
                        {selectedLead?.status?.charAt(0).toUpperCase() + selectedLead?.status?.slice(1)} Lead
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Lead Information Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FiUser className="text-blue-600" />
                      <div>
                        <span className="text-gray-600 text-sm">Full Name:</span>
                        <p className="font-semibold text-gray-900">{selectedLead?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiMail className="text-blue-600" />
                      <div>
                        <span className="text-gray-600 text-sm">Email:</span>
                        <p className="font-semibold text-gray-900">{selectedLead?.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiPhone className="text-blue-600" />
                      <div>
                        <span className="text-gray-600 text-sm">Phone:</span>
                        <p className="font-semibold text-gray-900">{selectedLead?.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiTarget className="text-orange-600" />
                    Lead Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedLead?.status)}`}>
                        {React.createElement(getStatusIcon(selectedLead?.status), { className: "text-sm" })}
                        {selectedLead?.status?.charAt(0).toUpperCase() + selectedLead?.status?.slice(1)}
                      </span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Status Description:</p>
                      <p className="text-sm text-gray-800">
                        {selectedLead?.status === "hot" && "This lead is highly engaged and ready to make a purchase decision."}
                        {selectedLead?.status === "warm" && "This lead has shown interest but needs more nurturing."}
                        {selectedLead?.status === "cold" && "This is an initial contact that requires warming up."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="text-slate-600" />
                  Lead Notes
                </h3>
                {selectedLead && (
                  <Notes relatedModel="Lead" relatedTo={selectedLead._id} />
                )}
              </div>

              {/* Lead Tasks Section */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCheckSquare className="text-blue-600" />
                  Lead Tasks
                </h3>
                {leadTasks.length === 0 ? (
                  <p className="text-gray-500">No tasks for this lead.</p>
                ) : (
                  <ul className="space-y-3">
                    {leadTasks.map((task) => (
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
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && selectedLead && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FiCheckSquare className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                  <p className="text-gray-600 text-sm">for {selectedLead.name}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskField}
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
                  {users.map((user) => (
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
}