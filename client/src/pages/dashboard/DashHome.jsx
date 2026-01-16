// src/pages/dashboard/Home.jsx

import { useEffect, useState } from "react";
import {
  FiUsers,
  FiFileText,
  FiBarChart,
  FiTrendingUp,
  FiCheckSquare,
  FiActivity,
  FiPlus,
  FiBriefcase,
  FiUserCheck,
  FiClock,
  FiTarget,
  FiArrowRight,
  FiCalendar,
  FiClipboard,
  FiZap,
  FiBookmark,
  FiPieChart,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiStar,
  FiShield,
} from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchDealsByStage } from "../../redux/dealSlice";
import { fetchStages } from "../../redux/stageSlice";
import axios from "../../api/axios";

// Recharts imports
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export default function DashHome() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dealsByStage: reduxDealsByStage } = useSelector((state) => state.deals);
  const { items: stages } = useSelector((state) => state.stages);
  const [kpis, setKpis] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [conversionRates, setConversionRates] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Transform Redux dealsByStage data for the pie chart
  const dealsByStage = stages.map((stage, index) => {
    const stageData = reduxDealsByStage?.find((d) => d._id === stage._id) || { count: 0 };
    return {
      name: stage.name,
      value: stageData.count || 0,
      color: COLORS[index % COLORS.length]
    };
  }).filter(item => item.value > 0);

  useEffect(() => {
    dispatch(fetchDealsByStage());
    dispatch(fetchStages());
  }, [dispatch]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [countsRes, activityRes, tasksRes, conversionRes] = await Promise.all([
          axios.get("/dashboard/counts"),
          axios.get("/dashboard/recent-activity"),
          axios.get("/task"),
          axios.get("/dashboard/conversion-rates"),
        ]);

        const counts = countsRes.data;
        const kpiArr = [
          { 
            label: "Customers", 
            value: counts.customers || 0,
            icon: FiUserCheck,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-100",
            textColor: "text-blue-600"
          },
          { 
            label: "Active Deals", 
            value: counts.deals || 0,
            icon: FiBriefcase,
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-100",
            textColor: "text-green-600"
          },
          { 
            label: "Hot Leads", 
            value: counts.leads || 0,
            icon: FiTrendingUp,
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-orange-100",
            textColor: "text-orange-600"
          },
          { 
            label: "Pending Tasks", 
            value: counts.tasks || 0,
            icon: FiCheckSquare,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-100",
            textColor: "text-purple-600"
          },
        ];
        
        // Add admin-only KPI
        if (user?.role === "admin") {
          kpiArr.push({
            label: "Total Users",
            value: counts.users || 0,
            icon: FiUsers,
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-100",
            textColor: "text-indigo-600"
          });
        }
        
        setKpis(kpiArr);

        setRecentActivity(
          Array.isArray(activityRes.data)
            ? activityRes.data.slice(0, 5).map((log) => ({
                id: log._id,
                text: log.action || log.description || log.entity || "Activity",
                time: new Date(log.createdAt).toLocaleString(),
                type: log.entityType || 'general'
              }))
            : []
        );

        const today = new Date();
        setTasks(
          Array.isArray(tasksRes.data)
            ? tasksRes.data
                .filter((task) => {
                  if (!task.dueDate) return false;
                  const due = new Date(task.dueDate);
                  const diffTime = due - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 3 && diffDays >= 0; // Next 3 days
                })
                .slice(0, 5)
            : []
        );

        // Fetch all deals and leads for the graph
        const [dealsRes, leadsRes] = await Promise.all([
          axios.get("/deals"),
          axios.get("/leads"),
        ]);

        // Group by day (last 7 days)
        const days = [];
        const todayChart = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(todayChart);
          d.setDate(todayChart.getDate() - i);
          days.push(d);
        }

        // Helper to format day label
        const dayLabel = (date) => date.toLocaleDateString(undefined, { weekday: "short" });

        // Count deals and leads per day
        const deals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
        const leads = Array.isArray(leadsRes.data) ? leadsRes.data : [];
        
        const chartData = days.map((date) => {
          const dayStr = date.toDateString();
          return {
            name: dayLabel(date),
            deals: deals.filter((d) => new Date(d.createdAt).toDateString() === dayStr).length,
            leads: leads.filter((l) => new Date(l.createdAt).toDateString() === dayStr).length,
          };
        });
        setChartData(chartData);

        // Set conversion rates
        setConversionRates(conversionRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.role]);

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'customer': return FiUserCheck;
      case 'deal': return FiBriefcase;
      case 'lead': return FiTrendingUp;
      case 'task': return FiCheckSquare;
      default: return FiActivity;
    }
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              {user?.role === 'admin' ? (
                <FiStar className="text-white text-2xl" />
              ) : (
                <FiShield className="text-white text-2xl" />
              )}
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {user?.name || "User"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening in your CRM today
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {kpis.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className={`text-xl ${kpi.textColor}`} />
                  </div>
                  <FiArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                  <p className="text-gray-600 text-sm font-medium">{kpi.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Wider */}
          <div className="xl:col-span-2 space-y-8">
            {/* Enhanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiTrendingUp className="text-blue-600" />
                    Weekly Trend
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="deals" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="leads" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiPieChart className="text-purple-600" />
                    Deal Stages
                  </h3>
                </div>
                <div className="h-64">
                  {dealsByStage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dealsByStage}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dealsByStage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p>No deals to display</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion Rates Chart */}
            {conversionRates && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiTarget className="text-green-600" />
                    Conversion Rates
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      {
                        name: 'Lead → Deal',
                        rate: conversionRates.leadToDealRate || 0,
                        color: '#3b82f6'
                      },
                      {
                        name: 'Deal → Customer',
                        rate: conversionRates.dealToCustomerRate || 0,
                        color: '#10b981'
                      },
                      {
                        name: 'Overall',
                        rate: conversionRates.overallConversionRate || 0,
                        color: '#f59e0b'
                      },
                      {
                        name: 'Deal Win Rate',
                        rate: conversionRates.dealWinRate || 0,
                        color: '#ef4444'
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                      />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2, 3].map((index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{(conversionRates.leadToDealRate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">Lead → Deal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{(conversionRates.dealToCustomerRate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">Deal → Customer</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{(conversionRates.overallConversionRate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">Overall</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{(conversionRates.dealWinRate || 0).toFixed(1)}%</p>
                    <p className="text-xs text-gray-600">Win Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiActivity className="text-green-600" />
                  Recent Activity
                </h3>
                <button 
                  onClick={() => navigate('/dashboard/logs')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200"
                >
                  View More <FiArrowRight className="text-xs" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((item) => {
                  const ActivityIcon = getActivityIcon(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ActivityIcon className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-sm">{item.text}</p>
                        <p className="text-gray-500 text-xs mt-1">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* View All Activities Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/dashboard/logs')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  <FiClipboard className="text-sm" />
                  View All Activity Logs
                  <FiArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Enhanced Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center gap-2 mb-6">
                <FiZap className="text-orange-600 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard/customers')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <FiUserCheck className="text-blue-600" />
                    <span className="font-medium text-gray-900">Manage Customers</span>
                  </div>
                  <FiArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/deals')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <FiBriefcase className="text-green-600" />
                    <span className="font-medium text-gray-900">View Deals</span>
                  </div>
                  <FiArrowRight className="text-green-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/leads')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-amber-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <FiTrendingUp className="text-orange-600" />
                    <span className="font-medium text-gray-900">Track Leads</span>
                  </div>
                  <FiArrowRight className="text-orange-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/tasks')}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-violet-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <FiCheckSquare className="text-purple-600" />
                    <span className="font-medium text-gray-900">Manage Tasks</span>
                  </div>
                  <FiArrowRight className="text-purple-600 group-hover:translate-x-1 transition-transform" />
                </button>

                {user?.role === "admin" && (
                  <button
                    onClick={() => navigate('/dashboard/users')}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <FiUsers className="text-indigo-600" />
                      <span className="font-medium text-gray-900">Manage Users</span>
                    </div>
                    <FiArrowRight className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Upcoming Tasks */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiClock className="text-blue-600" />
                  Upcoming Tasks
                </h3>
                <Link 
                  to="/dashboard/tasks" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  View All <FiArrowRight className="text-xs" />
                </Link>
              </div>
              
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm">No upcoming tasks in the next 3 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const dueDate = new Date(task.dueDate);
                    const isToday = dueDate.toDateString() === new Date().toDateString();
                    const isTomorrow = dueDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    
                    return (
                      <div 
                        key={task._id} 
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate('/dashboard/tasks')}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          isToday ? 'bg-red-500' : isTomorrow ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTaskPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}