import React, { useEffect, useState, useMemo } from "react";
import Loading from "../Loading";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeals,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../../redux/dealSlice";
import { createTask, fetchTasks } from "../../redux/taskSlice";
import { fetchUsers } from "../../redux/userSlice";
import socketService from "../../services/socketService";
import {
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash,
  FiBriefcase,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiX,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiFileText,
  FiUsers,
  FiActivity,
  FiCheckSquare,
} from "react-icons/fi";
import Notes from "./Notes";
import axios from "../../api/axios";

const Deals = () => {
  const dispatch = useDispatch();
  const { deals, loading } = useSelector((state) => state.deals);
  const { items: users = [], loading: usersLoading } = useSelector((state) => state.users || { items: [] });
  const { tasks: allTasks = [] } = useSelector((state) => state.tasks || { tasks: [] });

  const [customers, setCustomers] = useState([]);
  const [stages, setStages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    customer: "",
    stage: "",
    closeDate: "",
    status: "In Progress",
  });
  const [editId, setEditId] = useState(null);

  // --- Task Modal State ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });
  const handleTaskField = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  // filter tasks for currently viewed deal
  const dealTasks = useMemo(() => {
    if (!viewModal) return [];
    return allTasks.filter((task) => {
      const model = task.relatedModel?.toLowerCase?.() || task.type?.toLowerCase?.();
      const relatedId = task.relatedTo?._id || task.relatedTo || task.refId;
      const related = relatedId && String(relatedId) === String(viewModal._id);
      console.log('Task filter debug:', { task_id: task._id, model, related, relatedId, viewModalId: viewModal._id });
      return model === "deal" && related;
    });
  }, [allTasks, viewModal]);
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!viewModal) return;
    if (!taskForm.title) {
      alert("Please enter a task title.");
      return;
    }

    // build clean payload (prevent sending empty strings for optional fields)
    const payload = {
      title: taskForm.title,
      type: "Deal",
      refId: viewModal._id,
    };
    if (taskForm.description) payload.description = taskForm.description;
    if (taskForm.dueDate) payload.dueDate = taskForm.dueDate;
    if (taskForm.priority) payload.priority = taskForm.priority;
    if (taskForm.assignedTo) payload.assignedTo = taskForm.assignedTo;

    console.log('Submitting task payload', payload);

    try {
      const result = await dispatch(createTask(payload));
      console.log('Task creation result:', result);
      if (result.error) {
        console.error('Task creation failed:', result.error);
      }

      // re-fetch tasks for this deal so we always have full set regardless of permissions
      if (viewModal) {
        dispatch(fetchTasks({ relatedModel: 'Deal', relatedTo: viewModal._id }));
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

  useEffect(() => {
    dispatch(fetchDeals());
    dispatch(fetchUsers());
    // initial load of tasks (only those relevant to user)
    dispatch(fetchTasks());
    const fetchOptions = async () => {
      try {
        const [custRes, stageRes] = await Promise.all([
          axios.get("/customer"),
          axios.get("/stages"),
        ]);
        setCustomers(custRes.data);
        setStages(stageRes.data);
      } catch (err) {
        console.error("Failed to fetch customers or stages", err);
      }
    };
    fetchOptions();
  }, [dispatch]);

  // whenever we open or change the deal being viewed, pull its tasks explicitly
  useEffect(() => {
    if (viewModal) {
      dispatch(fetchTasks({ relatedModel: 'Deal', relatedTo: viewModal._id }));
    }
  }, [dispatch, viewModal]);

  const handleOpenModal = (deal = null) => {
    if (deal) {
      setFormData({
        title: deal.title,
        value: deal.value,
        customer: deal.customer?._id || "",
        stage: deal.stage?._id || "",
        closeDate: deal.closeDate ? deal.closeDate.split("T")[0] : "",
        status: deal.status,
      });
      setEditId(deal._id);
    } else {
      setFormData({
        title: "",
        value: "",
        customer: "",
        stage: "",
        closeDate: "",
        status: "In Progress",
      });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      dispatch(updateDeal({ id: editId, dealData: formData })).then(() => {
        // Emit real-time deal update
        socketService.emitDealUpdated({
          id: editId,
          title: formData.title,
          stage: formData.stage
        });
      });
    } else {
      dispatch(createDeal(formData));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this deal?")) {
      dispatch(deleteDeal(id));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Won":
        return FiCheckCircle;
      case "Lost":
        return FiXCircle;
      case "In Progress":
      default:
        return FiClock;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
      Won: "bg-green-50 text-green-700 border border-green-200",
      Lost: "bg-red-50 text-red-700 border border-red-200",
    };
    return styles[status] || styles["In Progress"];
  };

  const filteredDeals = deals?.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(search.toLowerCase()) ||
      deal.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || deal.status === statusFilter;
    const matchesStage =
      stageFilter === "all" || deal.stage?._id === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  }) || [];

  const dealStats = {
    total: deals?.length || 0,
    won: deals?.filter((d) => d.status === "Won").length || 0,
    inProgress: deals?.filter((d) => d.status === "In Progress").length || 0,
    lost: deals?.filter((d) => d.status === "Lost").length || 0,
    totalValue:
      deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
    wonValue:
      deals
        ?.filter((d) => d.status === "Won")
        .reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiBriefcase className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Deal Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage your sales pipeline
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="text-lg" />
              Create Deal
            </button>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Deals</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {dealStats.total}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiBriefcase className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Won</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600">
                    {dealStats.won}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="text-green-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">In Progress</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600">
                    {dealStats.inProgress}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiClock className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Lost</p>
                  <p className="text-2xl lg:text-3xl font-bold text-red-600">
                    {dealStats.lost}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiXCircle className="text-red-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Value</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    ₹{dealStats.totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="text-purple-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Won Value</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    ₹{dealStats.wonValue.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="text-green-600 text-lg lg:text-xl" />
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
                  placeholder="Search deals by title or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
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

              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white min-w-[140px]"
                >
                  <option value="all">All Stages</option>
                  {stages.map((stage) => (
                    <option key={stage._id} value={stage._id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 font-medium">
                  Loading deals...
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Deals Grid */}
          {!loading && filteredDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDeals.map((deal) => {
                const StatusIcon = getStatusIcon(deal.status);
                return (
                  <div
                    key={deal._id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg transition-all duration-200 group"
                  >
                    {/* Deal Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {deal.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              deal.status
                            )}`}
                          >
                            <StatusIcon className="text-xs" />
                            {deal.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setViewModal(deal)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                          title="View Details"
                        >
                          <FiEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(deal)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-150"
                          title="Edit Deal"
                        >
                          <FiEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                          title="Delete Deal"
                        >
                          <FiTrash className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Deal Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FiDollarSign className="text-green-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">
                            Deal Value
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{(deal.value || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiUser className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">
                            Customer
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {deal.customer?.name || "No customer"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FiTarget className="text-purple-600 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-medium">
                            Stage
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {deal.stage?.name || "No stage"}
                          </p>
                        </div>
                      </div>

                      {deal.closeDate && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FiCalendar className="text-orange-600 text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">
                              Close Date
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(deal.closeDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !loading && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
                <div className="text-gray-500">
                  <FiBriefcase className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Deals Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {search || statusFilter !== "all" || stageFilter !== "all"
                      ? "No deals match your current filters."
                      : "Get started by creating your first deal."}
                  </p>
                  {(search || statusFilter !== "all" || stageFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setStageFilter("all");
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Enhanced Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {editId ? (
                      <FiEdit className="text-white text-lg" />
                    ) : (
                      <FiPlus className="text-white text-lg" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editId ? "Edit Deal" : "Create New Deal"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {editId
                        ? "Update deal information"
                        : "Fill in the deal details below"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    placeholder="Enter deal title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiDollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) =>
                      setFormData({ ...formData, stage: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white"
                  >
                    <option value="">Select stage</option>
                    {stages.map((stage) => (
                      <option key={stage._id} value={stage._id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.closeDate}
                    onChange={(e) =>
                      setFormData({ ...formData, closeDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  />
                </div>
              </div>

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
                  {editId ? "Update Deal" : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced View Modal */}
      {viewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                    <FiBriefcase className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {viewModal.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          viewModal.status
                        )}`}
                      >
                        {React.createElement(getStatusIcon(viewModal.status), {
                          className: "text-sm",
                        })}
                        {viewModal.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Deal Information Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiDollarSign className="text-blue-600" />
                    Financial Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Deal Value:</span>
                      <span className="font-bold text-2xl text-gray-900">
                        ₹{(viewModal.value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUsers className="text-green-600" />
                    Relationship Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-semibold text-gray-900">
                        {viewModal.customer?.name || "No customer"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stage:</span>
                      <span className="font-semibold text-gray-900">
                        {viewModal.stage?.name || "No stage"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Information */}
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCalendar className="text-amber-600" />
                  Timeline
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">
                      Expected Close Date:
                    </span>
                    <p className="font-semibold text-gray-900">
                      {viewModal.closeDate
                        ? new Date(viewModal.closeDate).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Current Status:</span>
                    <p className="font-semibold text-gray-900">{viewModal.status}</p>
                  </div>
                </div>
              </div>

              {/* Deal Tasks Section */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiCheckSquare className="text-blue-600" />
                  Deal Tasks
                </h3>
                {dealTasks.length === 0 ? (
                  <p className="text-gray-500">No tasks for this deal.</p>
                ) : (
                  <ul className="space-y-3">
                    {dealTasks.map((task) => (
                      <li key={task._id} className="bg-white rounded-lg p-4 shadow flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{task.title}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-green-100 text-green-700" : task.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{task.status}</span>
                        </div>
                        {task.description && <p className="text-gray-600 text-sm">{task.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Due: {task.dueDate ? task.dueDate.split('T')[0] : "No due date"}</span>
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
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="text-slate-600" />
                  Deal Notes
                </h3>
                <Notes relatedModel="Deal" relatedTo={viewModal._id} />
              </div>

              {/* Deal Activity */}
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiActivity className="text-purple-600" />
                  Deal Activity
                </h3>
                <div className="text-center py-6 text-gray-500">
                  <FiActivity className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                  <p className="font-medium">No activity recorded</p>
                  <p className="text-sm">Deal activity and updates will appear here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && viewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <FiCheckSquare className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Create New Task
                  </h2>
                  <p className="text-gray-600 text-sm">for {viewModal.title}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To (User)
                </label>
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

export default Deals;