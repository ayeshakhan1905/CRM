import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../api/axios"; // your configured axios with auth headers

// Fetch logs with filters/pagination
export const fetchLogs = createAsyncThunk(
  "logs/fetchLogs",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/logs", { params });
      return data; // { success, page, limit, totalPages, totalLogs, data: [] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  items: [],
  page: 1,
  limit: 10,
  totalPages: 1,
  totalLogs: 0,
  loading: false,
  error: null,

  // UI filters (kept here to persist on route changes if needed)
  filters: {
    entity: "",
    q: "",
    from: "",
    to: "",
  },
};

const logSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    setLogFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // reset to first page on filter change
    },
    setLogPage: (state, action) => {
      state.page = action.payload;
    },
    setLogLimit: (state, action) => {
      state.limit = action.payload;
      state.page = 1;
    },
    clearLogsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
        state.totalLogs = action.payload.totalLogs;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load logs";
      });
  },
});

export const { setLogFilters, setLogPage, setLogLimit, clearLogsState } =
  logSlice.actions;

export default logSlice.reducer;