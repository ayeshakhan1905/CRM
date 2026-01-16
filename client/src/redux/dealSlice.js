// frontend/src/redux/dealSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// --- Async Thunks ---
export const fetchDeals = createAsyncThunk("deals/fetchAll", async (_, thunkAPI) => {
  try {
    const res = await axios.get("/deals");
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch deals");
  }
});

export const createDeal = createAsyncThunk("deals/create", async (dealData, thunkAPI) => {
  try {
    const res = await axios.post("/deals", dealData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create deal");
  }
});

export const updateDeal = createAsyncThunk("deals/update", async ({ id, dealData }, thunkAPI) => {
  try {
    const res = await axios.put(`/deals/${id}`, dealData);
    console.log(res.data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update deal");
  }
});

export const deleteDeal = createAsyncThunk("deals/delete", async (id, thunkAPI) => {
  try {
    await axios.delete(`/deals/${id}`);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete deal");
  }
});

// ✅ NEW: fetch deals by stage
export const fetchDealsByStage = createAsyncThunk("deals/fetchByStage", async (_, thunkAPI) => {
  try {
    const res = await axios.get("/dashboard/deals-by-stage");
    return res.data; // [{ _id: "Prospecting", count: 3, totalValue: 5000 }, ...]
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch deals by stage");
  }
});

// --- Slice ---
const dealSlice = createSlice({
  name: "deals",
  initialState: {
    deals: [],       // ✅ all deals
    dealsByStage: [],// ✅ aggregated data from API
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDeals.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchDeals.fulfilled, (state, action) => { 
        state.loading = false; 
        state.deals = action.payload; 
      })
      .addCase(fetchDeals.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })

      // Create
      .addCase(createDeal.fulfilled, (state, action) => { 
        state.deals.push(action.payload); 
      })
      .addCase(createDeal.rejected, (state, action) => { 
        state.error = action.payload; 
      })

      // Update
      .addCase(updateDeal.fulfilled, (state, action) => {
        const idx = state.deals.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.deals[idx] = action.payload;
      })
      .addCase(updateDeal.rejected, (state, action) => { 
        state.error = action.payload; 
      })

      // Delete
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.deals = state.deals.filter((d) => d._id !== action.payload);
      })
      .addCase(deleteDeal.rejected, (state, action) => { 
        state.error = action.payload; 
      })

      // ✅ Deals by stage
      .addCase(fetchDealsByStage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDealsByStage.fulfilled, (state, action) => {
        state.loading = false;
        state.dealsByStage = action.payload;
      })
      .addCase(fetchDealsByStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dealSlice.reducer;