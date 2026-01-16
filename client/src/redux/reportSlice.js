// redux/reportSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// --- Async Thunk ---
export const fetchReports = createAsyncThunk(
  "reports/fetchReports",
  async (filters, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/reports", {
        params: {
          from: filters?.from || undefined,
          to: filters?.to || undefined,
          range: filters?.range || undefined,
          userId: filters?.userId || undefined,
        },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const reportSlice = createSlice({
  name: "reports",
  initialState: {
    reports: {},
    filters: {}, // default empty
    loading: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters } = reportSlice.actions;
export default reportSlice.reducer;