import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../redux/notificationSlice";
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiUser,
  FiBriefcase,
  FiTrendingUp,
  FiFileText,
  FiFilter,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const NotificationHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector((state) => state.notifications);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-green-500" />;
      case "warning":
        return <FiAlertTriangle className="text-yellow-500" />;
      case "error":
        return <FiAlertCircle className="text-red-500" />;
      case "task":
        return <FiFileText className="text-blue-500" />;
      case "deal":
        return <FiBriefcase className="text-purple-500" />;
      case "lead":
        return <FiTrendingUp className="text-orange-500" />;
      case "customer":
        return <FiUser className="text-indigo-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "task":
        return "border-blue-200 bg-blue-50";
      case "deal":
        return "border-purple-200 bg-purple-50";
      case "lead":
        return "border-orange-200 bg-orange-50";
      case "customer":
        return "border-indigo-200 bg-indigo-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "task":
        return "bg-blue-100 text-blue-800";
      case "deal":
        return "bg-purple-100 text-purple-800";
      case "lead":
        return "bg-orange-100 text-orange-800";
      case "customer":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "read" && !n.isRead) return false;
    if (selectedType !== "all" && n.type !== selectedType) return false;
    return true;
  });

  const notificationTypes = [
    "all",
    ...new Set(notifications.map((n) => n.type)),
  ];

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <FiArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notification History
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredNotifications.length} notification
                  {filteredNotifications.length !== 1 ? "s" : ""}
                  {unreadCount > 0 && ` • ${unreadCount} unread`}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiFilter className="text-base" />
                Filters
              </h3>

              {/* Status Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Status
                </h4>
                <div className="space-y-2">
                  {["all", "unread", "read"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={filter === status}
                        onChange={(e) => setFilter(e.target.value)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status === "all"
                          ? "All"
                          : status === "unread"
                            ? "Unread"
                            : "Read"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Type
                </h4>
                <div className="space-y-2">
                  {notificationTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={selectedType === type}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {type === "all" ? "All Types" : type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`bg-white border rounded-lg p-5 transition-all hover:shadow-md ${
                      !notification.isRead
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-lg flex-shrink-0 ${getTypeColor(notification.type)}`}
                      >
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className={`font-semibold ${
                                  !notification.isRead
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTypeBadgeColor(
                                  notification.type
                                )}`}
                              >
                                {notification.type}
                              </span>
                              {!notification.isRead && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-xs text-gray-500">
                                {formatFullDate(notification.createdAt)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <FiCheck className="text-lg" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FiBell className="text-gray-400 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-600 mb-4">
                  {filter !== "all" || selectedType !== "all"
                    ? "No notifications match your filters. Try adjusting them."
                    : "You're all caught up! You don't have any notifications yet."}
                </p>
                {(filter !== "all" || selectedType !== "all") && (
                  <button
                    onClick={() => {
                      setFilter("all");
                      setSelectedType("all");
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;
