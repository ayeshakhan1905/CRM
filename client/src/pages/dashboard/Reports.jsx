import { useEffect } from "react";
import Loading from "../Loading";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports } from "../../redux/reportSlice";
import ReportFilters from "../../components/reportFilter";
import { FiBarChart2, FiUsers, FiCheckSquare } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { reports, filters, loading, error } = useSelector(
    (state) => state.reports
  );

  useEffect(() => {
    dispatch(fetchReports(filters));
  }, [dispatch, filters]);

  console.log(reports);

  // --- Derived Totals ---
  const totalLeads = reports.totalLeads || 0;
  const totalDeals = reports.totalDeals || 0;
  const totalTasks = reports.totalTasks || 0;

  // --- Chart Data ---
  const dealsByStage = reports.deals?.map((d) => ({
    name: d._id,
    value: d.total,
  })) || [];

  const leadsTimeline = reports.leads?.map((l) => ({
    month: `M${l._id}`,
    total: l.total,
  })) || [];

  const tasksByStatus = reports.tasks?.map((t) => ({
    status: t._id,
    count: t.total,
  })) || [];

  const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];

  return (
    <div className="space-y-8 px-2 md:px-8 py-8">
      {/* Loader */}
      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-extrabold text-gray-900">CRM Reports Dashboard</h1>
            <div className="w-full md:w-auto">
              <ReportFilters />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-4">
              Error: {error}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <FiUsers className="text-4xl mb-2" />
              <p className="text-sm opacity-80">Total Leads</p>
              <p className="text-3xl font-extrabold">{totalLeads}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <FiBarChart2 className="text-4xl mb-2" />
              <p className="text-sm opacity-80">Total Deals</p>
              <p className="text-3xl font-extrabold">{totalDeals}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <FiCheckSquare className="text-4xl mb-2" />
              <p className="text-sm opacity-80">Total Tasks</p>
              <p className="text-3xl font-extrabold">{totalTasks}</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Pie Chart - Deals by Stage */}
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-blue-700">Deals by Stage</h2>
              {dealsByStage.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dealsByStage}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {dealsByStage.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No deals data available</p>
              )}
            </div>

            {/* Line Chart - Leads Timeline */}
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-green-700">Leads Over Months</h2>
              {leadsTimeline.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={leadsTimeline}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="url(#colorLeads)"
                      strokeWidth={3}
                      dot={{ r: 5, stroke: "#3B82F6", strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 8, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No leads data available</p>
              )}
            </div>

            {/* Bar Chart - Tasks by Status */}
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-purple-700">Tasks by Status</h2>
              {tasksByStatus.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tasksByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No tasks data available</p>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mt-8">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Recent Task Timeline</h2>
            {reports.timeline && reports.timeline.length ? (
              <ul className="divide-y divide-gray-200">
                {reports.timeline.map((task, idx) => (
                  <li key={task._id || idx} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-blue-600">{task.title}</span>
                      <span className="ml-2 text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recent tasks found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;