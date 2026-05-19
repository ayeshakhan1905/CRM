import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchReports, setFilters } from "../../redux/reportSlice";
import ReportFilters from "../../components/reportFilter";
import Loading from "../Loading";
import LeadDetailModal from "../../components/LeadDetailModal";
import { FiUser, FiUsers, FiBriefcase, FiFileText, FiTrendingUp, FiActivity, FiDollarSign, FiCalendar, FiEye } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from "../../api/axios";

export default function UserActivity() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { reports, filters, loading, error } = useSelector((state) => state.reports);
  const { user } = useSelector((state) => state.auth);

  const [prospects, setProspects] = useState([]);
  const [prospectsPagination, setProspectsPagination] = useState(null);
  const [currentProspectsPage, setCurrentProspectsPage] = useState(1);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState(null);
  const [selectedProspectType, setSelectedProspectType] = useState(null);
  const [showProspectModal, setShowProspectModal] = useState(false);

  // parse query params and sync with Redux
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const f = {};
    for (const [k, v] of params.entries()) {
      f[k] = v;
    }
    if (id) {
      f.userId = id;
    }

    dispatch(setFilters(f));
    dispatch(fetchReports(f));
  }, [id, location.search, dispatch]);

  // Fetch prospects (leads & customers combined)
  useEffect(() => {
    const fetchProspects = async () => {
      setLoadingDetails(true);
      try {
        const baseParams = new URLSearchParams();
        if (filters.range) baseParams.append('range', filters.range);
        if (filters.from) baseParams.append('from', filters.from);
        if (filters.to) baseParams.append('to', filters.to);

        // Fetch all prospects (leads + customers)
        const prospectParams = new URLSearchParams(baseParams);
        // Add userId filter if viewing specific user
        if (id) prospectParams.append('userId', id);
        prospectParams.append('page', currentProspectsPage.toString());
        prospectParams.append('limit', '10');
        const prospectRes = await axios.get(`/reports/prospects?${prospectParams.toString()}`);
        setProspects(prospectRes.data.data || []);
        setProspectsPagination(prospectRes.data.pagination);

      } catch (err) {
        console.error('Error fetching prospects:', err);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (user) {
      fetchProspects();
    }
  }, [user, filters, currentProspectsPage, id]);

  const totalLeads = reports.totalLeads || 0;
  const totalDeals = reports.totalDeals || 0;
  const leadsConverted = reports.leadsConverted || 0;
  const totalCustomers = reports.totalCustomers || 0;

  const onCardClick = (type) => {
    let path = "/dashboard/";
    const dateParams = [];
    if (filters.range) dateParams.push(`range=${filters.range}`);
    if (filters.from) dateParams.push(`from=${filters.from}`);
    if (filters.to) dateParams.push(`to=${filters.to}`);
    if (id) {
      dateParams.push(`createdBy=${id}`);
    }

    switch (type) {
      case "leads":
        path += `leads?${dateParams.join("&")}`;
        break;
      case "leadsConverted":
        // reuse leads route but include converted flag
        path += `leads?${dateParams.concat("converted=true").join("&")}`;
        break;
      case "customers":
        path += `customers?${dateParams.join("&")}`;
        break;
      case "deals":
        path += `deals?${dateParams.join("&")}`;
        break;
      default:
        return;
    }
    navigate(path);
  };

  // Prepare data for charts
  const chartData = [
    { name: 'Leads', value: totalLeads, color: '#3B82F6' },
    { name: 'Converted', value: leadsConverted, color: '#10B981' },
    { name: 'Customers', value: totalCustomers, color: '#8B5CF6' },
    { name: 'Deals', value: totalDeals, color: '#6366F1' }
  ];

  // Conversion rate: Lead → Customer
  const conversionRate = totalLeads > 0 ? ((totalCustomers / totalLeads) * 100).toFixed(1) : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'interested': return 'bg-yellow-100 text-yellow-800';
      case 'not interested': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProspectsPageChange = (page) => {
    setCurrentProspectsPage(page);
  };

  const handleProspectsNextPage = () => {
    if (prospectsPagination?.hasNext) {
      setCurrentProspectsPage(currentProspectsPage + 1);
    }
  };

  const handleProspectsPrevPage = () => {
    if (prospectsPagination?.hasPrev) {
      setCurrentProspectsPage(currentProspectsPage - 1);
    }
  };

  const handleProspectClick = (prospectId, prospectType) => {
    setSelectedProspectId(prospectId);
    setSelectedProspectType(prospectType);
    setShowProspectModal(true);
  };

  const handleCloseModal = () => {
    setShowProspectModal(false);
    setSelectedProspectId(null);
    setSelectedProspectType(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiActivity className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Activity Dashboard</h1>
              <p className="text-sm text-gray-600">Track performance metrics and activity trends</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ReportFilters fixedUserId={id} />
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {loading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex items-center">
              <FiTrendingUp className="text-red-500 mr-2" />
              Error: {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Key Metrics Cards - Horizontal Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => onCardClick("leads")}
                className="cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Leads Added</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeads}</p>
                  </div>
                  <FiFileText className="text-2xl text-blue-500" />
                </div>
              </div>

              <div
                onClick={() => onCardClick("leadsConverted")}
                className="cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Converted</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{leadsConverted}</p>
                  </div>
                  <FiUsers className="text-2xl text-green-500" />
                </div>
              </div>

              <div
                onClick={() => onCardClick("customers")}
                className="cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Customers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomers}</p>
                  </div>
                  <FiUser className="text-2xl text-purple-500" />
                </div>
              </div>

              <div
                onClick={() => onCardClick("deals")}
                className="cursor-pointer bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Deals</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalDeals}</p>
                  </div>
                  <FiBriefcase className="text-2xl text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Charts and Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Overview Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTrendingUp className="mr-2 text-blue-600" />
                  Activity Overview
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Rate & Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiActivity className="mr-2 text-green-600" />
                  Performance Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Conversion Rate</span>
                    <span className="text-lg font-bold text-green-600">{conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Activities</span>
                    <span className="text-lg font-bold text-blue-600">{totalLeads + totalCustomers + totalDeals}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Active Period</span>
                    <span className="text-sm text-gray-600">
                      {filters.range ? `${filters.range}` : filters.from && filters.to ? `${filters.from} to ${filters.to}` : 'All time'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* All Prospects Section (Leads + Customers) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiUsers className="mr-2 text-blue-600" />
                  All Prospects ({prospectsPagination?.total || 0})
                </h3>
                {prospectsPagination && (
                  <div className="text-sm text-gray-500">
                    Page {prospectsPagination.currentPage} of {prospectsPagination.totalPages}
                  </div>
                )}
              </div>
              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : prospects.length > 0 ? (
                <div className="space-y-4">
                  {prospects.map((prospect) => (
                    <div
                      key={prospect._id}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                      onClick={() => handleProspectClick(prospect._id, prospect.type)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiUser className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{prospect.name}</h4>
                              <p className="text-sm text-gray-600">{prospect.email}</p>
                              {prospect.phone && <p className="text-sm text-gray-600">{prospect.phone}</p>}
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                prospect.type === 'customer' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {prospect.type === 'customer' ? 'Customer' : 'Lead'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 font-medium">Status:</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prospect.status)}`}>
                                {prospect.status || 'N/A'}
                              </span>
                            </div>
                            {prospect.deals && prospect.deals.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 font-medium">Deals:</span>
                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                  {prospect.deals.length}
                                </span>
                              </div>
                            )}
                            {prospect.notes && prospect.notes.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 font-medium">Notes:</span>
                                <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                  {prospect.notes.length}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 font-medium">Added:</span>
                              <span className="text-xs text-gray-700">{formatDate(prospect.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-blue-200 pt-3 mt-3">
                        <span>Click to view full details & deals</span>
                        <span className="text-blue-600 font-medium">View Details →</span>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {prospectsPagination && prospectsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={handleProspectsPrevPage}
                        disabled={!prospectsPagination.hasPrev}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex space-x-2">
                        {Array.from({ length: prospectsPagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const current = prospectsPagination.currentPage;
                            return page === 1 || page === prospectsPagination.totalPages || (page >= current - 1 && page <= current + 1);
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 py-2 text-sm text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => handleProspectsPageChange(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                  page === prospectsPagination.currentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        onClick={handleProspectsNextPage}
                        disabled={!prospectsPagination.hasNext}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No prospects found for the selected period</p>
                </div>
              )}
            </div>

            {/* Activity Distribution Pie Chart */}
            {(totalLeads + totalCustomers + totalDeals) > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUsers className="mr-2 text-purple-600" />
                  Activity Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Prospect Detail Modal */}
      {showProspectModal && selectedProspectId && (
        <LeadDetailModal
          leadId={selectedProspectId}
          leadType={selectedProspectType}
          onClose={handleCloseModal}
          userRole={user?.role}
          currentUserId={user?._id}
        />
      )}
    </div>
  );
}