import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilters, fetchReports } from "../redux/reportSlice";
import axios from "../api/axios";

const ReportFilters = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state.reports);
  const { user } = useSelector((state) => state.auth); // 👈 assuming auth slice has logged-in user

  const [users, setUsers] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);

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
    setLocalFilters({ ...localFilters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
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
    <div className="bg-white p-4 rounded-2xl shadow flex flex-wrap gap-4 items-end">
      {/* Date From */}
      <div>
        <label className="text-sm font-medium">From</label>
        <input
          type="date"
          name="from"
          value={localFilters.from || ""}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="text-sm font-medium">To</label>
        <input
          type="date"
          name="to"
          value={localFilters.to || ""}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      {/* Range */}
      <div>
        <label className="text-sm font-medium">Range</label>
        <select
          name="range"
          value={localFilters.range || ""}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
        >
          <option value="">All</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* User Dropdown - Only for Admin */}
      {user?.role === "admin" && (
        <div>
          <label className="text-sm font-medium">User</label>
          <select
            name="userId"
            value={localFilters.userId || ""}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
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

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={applyFilters}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={resetFilters}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ReportFilters