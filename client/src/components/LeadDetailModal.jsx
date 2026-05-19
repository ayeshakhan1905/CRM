import { useState, useEffect } from "react";
import { FiX, FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiBriefcase, FiFileText, FiActivity } from "react-icons/fi";
import axios from "../api/axios";

const LeadDetailModal = ({ leadId, leadType = 'lead', onClose, userRole }) => {
  const [entity, setEntity] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCustomer = leadType === 'customer';
  const totalDealValue = deals.reduce((sum, deal) => sum + ((deal.amount ?? deal.value) || 0), 0);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        setLoading(true);

        const isCustomer = leadType === 'customer';
        const endpoint = isCustomer ? `/customer/${leadId}` : `/leads/${leadId}`;
        const leadRes = await axios.get(endpoint);
        const leadData = leadRes.data;
        setEntity(leadData);

        if (isCustomer) {
          setCustomer(leadData);
        } else if (leadData.customer) {
          try {
            const customerRes = await axios.get(`/customer/${leadData.customer}`);
            setCustomer(customerRes.data);
          } catch (custErr) {
            console.warn('Error fetching customer details:', custErr);
          }
        }

        // Fetch related deals for this prospect
        try {
          const dealsRes = await axios.get(`/deals`);
          const allDeals = dealsRes.data?.data ?? dealsRes.data ?? [];
          const relatedDeals = allDeals.filter(deal =>
            isCustomer
              ? deal.customer === leadId
              : deal.lead === leadId || (leadData.customer && deal.customer === leadData.customer)
          );
          setDeals(relatedDeals);
        } catch (dealErr) {
          console.warn('Error fetching deals:', dealErr);
        }

        // Fetch related tasks for this prospect
        try {
          const tasksRes = await axios.get(`/task`);
          const allTasks = tasksRes.data?.data ?? tasksRes.data ?? [];
          const relatedTasks = allTasks.filter(task =>
            isCustomer
              ? task.relatedTo === leadId
              : task.relatedTo === leadId || task.relatedTo === leadData.customer
          );
          setTasks(relatedTasks);
        } catch (taskErr) {
          console.warn('Error fetching tasks:', taskErr);
        }

        // Fetch activity logs for this prospect
        try {
          const logsRes = await axios.get(`/logs`);
          const relatedActivities = logsRes.data.data?.filter(log =>
            log.entityId === leadId && log.entityType === (isCustomer ? 'Customer' : 'Lead')
          ) || [];
          setActivities(relatedActivities);
        } catch (logErr) {
          console.warn('Error fetching activities:', logErr);
        }

      } catch (err) {
        console.error('Error fetching lead details:', err);
        setError(err.response?.data?.message || 'Failed to load prospect details');
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId, leadType]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{leadType === 'customer' ? 'Customer Details' : 'Lead Details'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="text-2xl" />
            </button>
          </div>
          <div className="text-center py-8">
            <FiXCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600">{error || (leadType === 'customer' ? 'Customer not found' : 'Lead not found')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiUser className="mr-2 text-blue-600" />
              {entity.name}
            </h2>
            <div className="flex items-center mt-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(entity.status)}`}>
                {entity.status || (leadType === 'customer' ? 'Customer' : 'N/A')}
              </span>
              {leadType !== 'customer' && entity.customer && (
                <span className="ml-2 inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                  <FiCheckCircle className="mr-1" />
                  Converted
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Information */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUser className="mr-2 text-blue-600" />
                {leadType === 'customer' ? 'Customer Information' : 'Lead Information'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-semibold text-gray-900">{entity.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FiMail className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold text-gray-900">{entity.email}</p>
                      </div>
                    </div>
                  </div>

                  {entity.phone && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiPhone className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-semibold text-gray-900">{entity.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(entity.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {entity.updatedAt !== entity.createdAt && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FiClock className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-semibold text-gray-900">{formatDate(entity.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion Summary */}
            {customer && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiCheckCircle className="mr-2 text-green-600" />
                  Conversion Summary
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Conversion Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(customer.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Conversion Value</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(totalDealValue)}</p>
                      </div>
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {deals.length} deal{deals.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {deals.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Primary Deal</p>
                          <p className="font-semibold text-gray-900">{deals[0].title || 'Unnamed deal'}</p>
                        </div>
                        <span className="text-sm text-gray-700">{formatCurrency(deals[0].amount ?? deals[0].value)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Stage: {deals[0].stage || 'N/A'}</span>
                        <span>Status: {deals[0].status || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {entity.notes && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiFileText className="mr-2 text-yellow-600" />
                  {leadType === 'customer' ? 'Customer Notes' : 'Lead Notes'}
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-yellow-300 transition-colors">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {typeof entity.notes === 'string' ? entity.notes : entity.notes?.content || 'No notes'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Deals, Tasks, Activities */}
          <div className="space-y-4">
            {/* Related Deals */}
            {deals.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiBriefcase className="mr-2 text-indigo-600" />
                  Related Deals ({deals.length})
                </h3>
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {deal.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Stage: <span className="font-medium">{deal.stage}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Customer: <span className="font-medium">{deal.customer?.name || 'N/A'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {formatCurrency(deal.amount ?? deal.value)}
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(deal.status)}`}>
                            {deal.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {formatDate(deal.createdAt)}</span>
                        <span className="text-indigo-600 group-hover:text-indigo-800">View Details →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Tasks */}
            {tasks.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiFileText className="mr-2 text-blue-600" />
                  Related Tasks ({tasks.length})
                </h3>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <FiCalendar className="mr-1" />
                              Due: {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                            </span>
                            {task.priority && (
                              <span className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  task.priority === 'high' ? 'bg-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}></span>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ml-3 flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Assigned: {task.assignedTo?.name || 'Unassigned'}</span>
                        <span className="text-blue-600 group-hover:text-blue-800">View Task →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {activities.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiActivity className="mr-2 text-orange-600" />
                  Lead Activity Timeline ({activities.length})
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {activities.slice(0, 15).map((activity, index) => (
                    <div key={activity._id} className="relative">
                      {/* Timeline line */}
                      {index < activities.slice(0, 15).length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-orange-200"></div>
                      )}

                      <div className="flex items-start space-x-4 group hover:bg-white hover:shadow-md p-3 rounded-lg transition-all duration-200 cursor-pointer">
                        {/* Activity icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                            <FiActivity className="text-white text-lg" />
                          </div>
                        </div>

                        {/* Activity content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 capitalize">
                              {activity.action} {activity.entityType}
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                            {activity.details}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {activity.method || 'System'}
                            </span>
                            {activity.ip && (
                              <span className="text-xs text-gray-500">
                                IP: {activity.ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length > 15 && (
                    <div className="text-center py-3">
                      <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-full hover:bg-orange-200 cursor-pointer transition-colors">
                        View {activities.length - 15} more activities
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;