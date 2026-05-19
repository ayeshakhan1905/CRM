import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilters, fetchReports } from "../redux/reportSlice";
import axios from "../api/axios";

const ReportFilters = ({ fixedUserId } = {}) => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.reports);
  const { user } = useSelector((state) => state.auth); // 👈 assuming auth slice has logged-in user

  const [users, setUsers] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);
  const [error, setError] = useState('');

  // whenever global filters change (e.g. page preset), sync local state
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // if a fixed userId is provided by parent, force it
  useEffect(() => {
    if (fixedUserId) {
      setLocalFilters((f) => ({ ...f, userId: fixedUserId }));
    }
  }, [fixedUserId]);

  // 🔹 Fetch users for dropdown (only if admin)
  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.role !== "admin") return;
      try {
        const { data } = await axios.get("/reports/users");
        setUsers(data.data || []);
      } catch (err) {
        console.error("Error fetching users:", err.message);
      }
    };
    fetchUsers();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // clear any previous error when user changes date fields
    if (name === 'from' || name === 'to') {
      setError('');
    }
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const applyFilters = () => {
    // validate date range
    const today = new Date().toISOString().split('T')[0];
    const { from, to } = localFilters;
    if (from && from > today) {
      setError('"From" date cannot be in the future');
      return;
    }
    if (to && to > today) {
      setError('"To" date cannot be in the future');
      return;
    }
    if (from && to && from > to) {
      setError('"From" date must be earlier than or equal to "To" date');
      return;
    }

    dispatch(setFilters(localFilters));
    dispatch(fetchReports(localFilters));
  };

  const resetFilters = () => {
    const reset = { from: "", to: "", range: "", userId: "" };
    setLocalFilters(reset);
    dispatch(setFilters(reset));
    dispatch(fetchReports(reset));
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg shadow-sm flex flex-wrap gap-3 items-end border border-gray-200">
      {/* Date From */}
      <div className="min-w-0">
        <label className="text-xs font-medium text-gray-700 block mb-1">From</label>
        <input
          type="date"
          name="from"
          max={new Date().toISOString().split('T')[0]}
          value={localFilters.from || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-full min-w-[120px]"
        />
      </div>

      {/* Date To */}
      <div className="min-w-0">
        <label className="text-xs font-medium text-gray-700 block mb-1">To</label>
        <input
          type="date"
          name="to"
          max={new Date().toISOString().split('T')[0]}
          value={localFilters.to || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-full min-w-[120px]"
        />
      </div>

      {/* Range */}
      <div className="min-w-0">
        <label className="text-xs font-medium text-gray-700 block mb-1">Range</label>
        <select
          name="range"
          value={localFilters.range || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-full min-w-[100px]"
        >
          <option value="">All</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
        </select>
      </div>

      {/* User Dropdown - Only for Admin */}
      {user?.role === "admin" && !fixedUserId && (
        <div className="min-w-0">
          <label className="text-xs font-medium text-gray-700 block mb-1">User</label>
          <select
            name="userId"
            value={localFilters.userId || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full min-w-[120px]"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* validation error message */}
      {error && (
        <div className="w-full text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          disabled={!!error}
          className={`bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Apply
        </button>
        <button
          onClick={resetFilters}
          className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ReportFilters