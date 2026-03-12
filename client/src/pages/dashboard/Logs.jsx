import { useEffect, useMemo, useState } from "react";
import Loading from "../Loading";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLogs,
  setLogFilters,
  setLogLimit,
  setLogPage,
} from "../../redux/logSlice";
import {
  FiSearch,
  FiDownload,
  FiCopy,
  FiActivity,
  FiFilter,
  FiCalendar,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX,
  FiClock,
  FiFileText,
  FiRefreshCcw,
  FiEye,
  FiTag,
  FiDatabase,
  FiAlertCircle,
} from "react-icons/fi";

const ENTITIES = ["Lead", "Deal", "Task", "Note", "Customer"];

const Logs = () => {
  const dispatch = useDispatch();
  const { items, loading, error, page, limit, totalPages, filters, totalLogs } =
    useSelector((s) => s.logs);
  const { user } = useSelector((s) => s.auth);

  const [entity, setEntity] = useState(filters.entity || "");
  const [q, setQ] = useState(filters.q || "");
  const [from, setFrom] = useState(filters.from || "");
  const [to, setTo] = useState(filters.to || "");

  // Only include from+to if both exist
  const queryParams = useMemo(() => {
    const params = {
      entity: entity || undefined,
      q: q || undefined,
      page,
      limit,
    };
    if (from && to) {
      params.from = from;
      params.to = to;
    }
    return params;
  }, [entity, q, from, to, page, limit]);

  useEffect(() => {
    dispatch(fetchLogs(queryParams));
  }, [dispatch, queryParams]);

  const applyFilters = () => {
    const applied = { entity, q };
    if (from && to) {
      applied.from = from;
      applied.to = to;
    }
    dispatch(setLogFilters(applied));
  };

  const resetFilters = () => {
    setEntity("");
    setQ("");
    setFrom("");
    setTo("");
    dispatch(setLogFilters({ entity: "", q: "", from: "", to: "" }));
  };

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      // You could add a toast notification here
    } catch {}
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "User", "Action", "Entity", "EntityId", "Details"],
      ...items.map((l) => [
        new Date(l.createdAt).toISOString(),
        l.createdBy?.name || "Unknown",
        l.action,
        l.entityType,
        l.entityId,
        (l.details || "").replace(/\n/g, " ").trim(),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEntityIcon = (entityType) => {
    const icons = {
      Lead: FiUser,
      Deal: FiFileText,
      Task: FiClock,
      Note: FiFileText,
      Customer: FiUser,
    };
    return icons[entityType] || FiDatabase;
  };

  const getEntityBadge = (entityType) => {
    const styles = {
      Lead: "bg-orange-50 text-orange-700 border border-orange-200",
      Deal: "bg-purple-50 text-purple-700 border border-purple-200",
      Task: "bg-blue-50 text-blue-700 border border-blue-200",
      Note: "bg-gray-50 text-gray-700 border border-gray-200",
      Customer: "bg-green-50 text-green-700 border border-green-200",
    };
    return styles[entityType] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const getActionBadge = (action) => {
    const baseStyle = "px-2 py-1 rounded-full text-xs font-medium";
    if (action.toLowerCase().includes("create")) {
      return `${baseStyle} bg-green-50 text-green-700 border border-green-200`;
    }
    if (action.toLowerCase().includes("update") || action.toLowerCase().includes("edit")) {
      return `${baseStyle} bg-blue-50 text-blue-700 border border-blue-200`;
    }
    if (action.toLowerCase().includes("delete")) {
      return `${baseStyle} bg-red-50 text-red-700 border border-red-200`;
    }
    return `${baseStyle} bg-gray-50 text-gray-700 border border-gray-200`;
  };

  const hasActiveFilters = entity || q || from || to;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      {loading ? (
        <Loading />
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiActivity className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Activity Logs
                </h1>
                <p className="text-gray-600 mt-1">Monitor all system activities and changes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-200/60">
                <FiDatabase className="text-gray-400" />
                <span className="font-medium">{totalLogs} total logs</span>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-medium"
              >
                <FiDownload className="text-lg" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiFilter className="text-purple-600" />
                Filter Logs
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FiX className="text-sm" />
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 bg-white"
                >
                  <option value="">All Entities</option>
                  {ENTITIES.map((e) => (
                    <option key={e} value={e}>
                      {e}s
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search action or details..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    min={from || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={!from}
                    title={!from ? "Please select a From Date first" : ""}
                    className={`w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 ${
                      !from ? "bg-gray-50 cursor-not-allowed opacity-60" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={applyFilters}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg px-4 py-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => dispatch(setLogLimit(Number(e.target.value)))}
                  className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalLogs)} of {totalLogs}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Activity Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            {error ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 text-red-600">
                  <FiAlertCircle className="text-2xl" />
                  <div>
                    <h3 className="font-semibold">Error Loading Logs</h3>
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <FiActivity className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Found</h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters 
                    ? "No activities match your current filters." 
                    : "No activity logs have been recorded yet."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      {user?.role === "admin" && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/60">
                    {items.map((log) => {
                      const EntityIcon = getEntityIcon(log.entityType);
                      return (
                        <tr key={log._id} className="hover:bg-purple-50/30 transition-colors duration-150">
                          {user?.role === "admin" && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {log.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {log.createdBy?.name || "Unknown User"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {log.createdBy?.email || "No email"}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className={getActionBadge(log.action)}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${getEntityBadge(log.entityType)}`}>
                                <EntityIcon className="text-sm" />
                                {log.entityType}
                              </span>
                              <button
                                onClick={() => copyId(log.entityId)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-mono transition-colors"
                                title="Copy Entity ID"
                              >
                                <FiCopy className="text-xs" />
                                {String(log.entityId).slice(0, 8)}...
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-md">
                              {log.details ? (
                                <div className="truncate" title={log.details}>
                                  {log.details}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No details</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FiClock className="text-gray-400 text-sm" />
                              <div className="text-sm">
                                <div className="text-gray-900 font-medium">
                                  {new Date(log.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-gray-500">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(setLogPage(1))}
                    disabled={page <= 1 || loading}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="First page"
                  >
                    <FiChevronsLeft className="text-sm" />
                  </button>
                  <button
                    onClick={() => dispatch(setLogPage(Math.max(page - 1, 1)))}
                    disabled={page <= 1 || loading}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Previous page"
                  >
                    <FiChevronLeft className="text-sm" />
                  </button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {(() => {
                      let start = Math.max(1, page - 2);
                      let end = Math.min(totalPages, start + 4);
                      if (end - start < 4) {
                        start = Math.max(1, end - 4);
                      }
                      start = Math.max(1, start);
                      end = Math.min(totalPages, end);
                      const pages = [];
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }
                      // Remove duplicates just in case
                      const uniquePages = [...new Set(pages)];
                      return uniquePages.map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => dispatch(setLogPage(pageNum))}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            pageNum === page
                              ? "bg-purple-600 text-white"
                              : "border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => dispatch(setLogPage(Math.min(page + 1, totalPages)))}
                    disabled={page >= totalPages || loading}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Next page"
                  >
                    <FiChevronRight className="text-sm" />
                  </button>
                  <button
                    onClick={() => dispatch(setLogPage(totalPages))}
                    disabled={page >= totalPages || loading}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Last page"
                  >
                    <FiChevronsRight className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logs;