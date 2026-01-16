import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import socketService from "../services/socketService";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from "../redux/notificationSlice";
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiX,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiUser,
  FiBriefcase,
  FiTrendingUp,
  FiFileText,
  FiSettings,
} from "react-icons/fi";

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const [persistentNotifications, setPersistentNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(getUnreadCount());
  }, [dispatch]);

  // Register callback for persistent notifications
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setPersistentNotifications(prev => [notification, ...prev]);
    };

    socketService.setNotificationCallback(handleNewNotification);

    return () => {
      socketService.setNotificationCallback(null);
    };
  }, []);

  const dismissPersistentNotification = (notificationId) => {
    setPersistentNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, notifications.length, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-500" />;
      case 'error':
        return <FiAlertCircle className="text-red-500" />;
      case 'task':
        return <FiFileText className="text-blue-500" />;
      case 'deal':
        return <FiBriefcase className="text-purple-500" />;
      case 'lead':
        return <FiTrendingUp className="text-orange-500" />;
      case 'customer':
        return <FiUser className="text-indigo-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'task':
        return 'border-blue-200 bg-blue-50';
      case 'deal':
        return 'border-purple-200 bg-purple-50';
      case 'lead':
        return 'border-orange-200 bg-orange-50';
      case 'customer':
        return 'border-indigo-200 bg-indigo-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationSettings = () => {
    // Request browser notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        alert('Browser notifications are already enabled!');
      } else if (Notification.permission === 'denied') {
        alert('Browser notifications are blocked. Please enable them in your browser settings.');
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            alert('Browser notifications enabled! You will now receive desktop notifications.');
          } else {
            alert('Browser notifications denied. You can enable them later from your browser settings.');
          }
        });
      }
    } else {
      alert('Browser notifications are not supported in this browser.');
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteNotification(id));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Persistent Notification Banners */}
      {persistentNotifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {persistentNotifications.slice(0, 3).map((notification) => (
            <div
              key={notification._id}
              className={`bg-white border-l-4 ${getTypeColor(notification.type).replace('bg-', 'border-l-')} shadow-lg rounded-r-lg p-4 animate-slide-in-right`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-gray-700 text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissPersistentNotification(notification._id)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Dismiss"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (   
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNotificationSettings}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Notification Settings"
              >
                <FiSettings className="text-sm" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <FiX className="text-lg" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="p-1 text-blue-600 hover:text-blue-800 rounded"
                                title="Mark as read"
                              >
                                <FiCheck className="text-sm" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification._id)}
                              className="p-1 text-red-600 hover:text-red-800 rounded"
                              title="Delete"
                            >
                              <FiTrash2 className="text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <FiBell className="text-gray-400 text-3xl mb-3" />
                <h4 className="font-medium text-gray-900 mb-1">No notifications</h4>
                <p className="text-sm text-gray-600 text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;