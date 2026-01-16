// src/pages/Tasks.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, createTask, updateTask, deleteTask } from "../../redux/taskSlice";
import {
  FiCheckSquare,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiUser,
  FiCalendar,
  FiFlag,
  FiX,
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiCircle,
  FiPlay,
  FiPause,
  FiFileText,
  FiLink,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";
import LoadingDemo from "../Loading";

const Tasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const users = useSelector((state) => state.users?.users || []);
  const leads = useSelector((state) => state.leads?.items || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    assignedTo: ""
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Helper functions for icons/badges
  const getStatusIcon = (status) => {
    if (status === "completed") return FiCheckCircle;
    if (status === "in-progress") return FiPlay;
    if (status === "pending") return FiPause;
    return FiCircle;
  };
  const getTypeIcon = (type) => {
    if (type === "customer") return FiUser;
    if (type === "deal") return FiTrendingUp;
    if (type === "lead") return FiFlag;
    return FiFileText;
  };
  const getStatusBadge = (status) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "in-progress") return "bg-blue-100 text-blue-700";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };
  const getPriorityBadge = (priority) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-yellow-100 text-yellow-700";
    if (priority === "low") return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };
  const getPriorityIcon = (priority) => {
    if (priority === "high") return <FiAlertCircle className="text-red-500" />;
    if (priority === "medium") return <FiFlag className="text-yellow-500" />;
    if (priority === "low") return <FiCircle className="text-gray-400" />;
    return <FiCircle className="text-gray-400" />;
  };

  // Edit modal logic
  const handleEdit = (task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      assignedTo: task.assignedTo?._id || ""
    });
    setIsModalOpen(true);
  };
  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    const payload = { ...editForm };
    if (!payload.assignedTo) delete payload.assignedTo;
    dispatch(updateTask({ id: selectedTask._id, task: payload }));
    setIsModalOpen(false);
    setSelectedTask(null);
  };
  const handleDelete = (id) => {
    dispatch(deleteTask(id));
  };

  // Filtering
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  // Stats
  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter(t => t.status === "completed").length || 0,
    inProgress: tasks?.filter(t => t.status === "in-progress").length || 0,
    pending: tasks?.filter(t => t.status === "pending").length || 0,
    overdue: tasks?.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length || 0,
  };
  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  // Helper to get lead name for a task
  const getLeadName = (task) => {
    if ((task.type?.toLowerCase?.() === "lead" || task.relatedModel?.toLowerCase?.() === "lead") && (task.refId || task.relatedTo)) {
      const leadId = task.refId || task.relatedTo;
      const lead = leads.find(l => l._id === leadId);
      return lead ? lead.name : "Lead";
    }
    return null;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-2 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCheckSquare className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Task Management
                </h1>
                <p className="text-gray-600 mt-1">Track and manage all your tasks efficiently</p>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{taskStats.total}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiCheckSquare className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600">{taskStats.completed}</p>
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
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600">{taskStats.inProgress}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiPlay className="text-blue-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl lg:text-3xl font-bold text-yellow-600">{taskStats.pending}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiPause className="text-yellow-600 text-lg lg:text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200/60 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Overdue</p>
                  <p className="text-2xl lg:text-3xl font-bold text-red-600">{taskStats.overdue}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiAlertCircle className="text-red-600 text-lg lg:text-xl" />
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
                  placeholder="Search tasks by title or description..."
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
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 bg-white min-w-[140px]"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {loading && <LoadingDemo />}

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-red-200/60 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="text-red-600 text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Tasks</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Tasks Table */}
          {!loading && filteredTasks.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/60">
                    {filteredTasks.map((task) => {
                      const StatusIcon = getStatusIcon(task.status);
                      const TypeIcon = getTypeIcon(task.relatedModel || task.type);
                      const overdueFlag = isOverdue(task.dueDate) && task.status !== "completed";
                      
                      return (
                        <tr key={task._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <StatusIcon className={`text-lg ${
                                  task.status === "completed" ? "text-green-500" : 
                                  task.status === "in-progress" ? "text-blue-500" : "text-gray-400"
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 truncate">{task.title}</h4>
                                  {overdueFlag && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full border border-red-200">
                                      <FiAlertCircle className="text-xs" />
                                      Overdue
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                              <StatusIcon className="text-sm" />
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                              {getPriorityIcon(task.priority)}
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {task.dueDate ? (
                              <div className="flex items-center gap-2">
                                <FiCalendar className={`text-sm ${overdueFlag ? "text-red-500" : "text-gray-400"}`} />
                                <span className={`text-sm ${overdueFlag ? "text-red-600 font-medium" : "text-gray-900"}`}>
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No due date</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="text-gray-400 text-sm" />
                              <span className="text-sm text-gray-900">
                                {task.relatedModel || task.type}
                                {getLeadName(task) ? `: ${getLeadName(task)}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {task.assignedTo?.name ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {task.assignedTo.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-900">{task.assignedTo.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                                title="Edit Task"
                              >
                                <FiEdit2 className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleDelete(task._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                                title="Delete Task"
                              >
                                <FiTrash2 className="text-lg" />
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
            !loading && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
                <div className="text-gray-500">
                  <FiCheckSquare className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                  <p className="text-gray-600 mb-6">
                    {search || statusFilter !== "all" || priorityFilter !== "all" 
                      ? "No tasks match your current filters." 
                      : "Get started by creating your first task."}
                  </p>
                  {(search || statusFilter !== "all" || priorityFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
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
      </div>
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsModalOpen(false)}
              title="Close"
            >
              <FiX className="text-xl" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Task</h2>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editForm.dueDate}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.assignedTo || ""}
                  onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Tasks;
