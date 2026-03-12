import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios"; // your axios instance

// 🔹 Fetch all leads
export const fetchLeads = createAsyncThunk("leads/fetchAll", async (_, thunkAPI) => {
  try {
    const res = await axios.get("/leads");
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch leads");
  }
});

// 🔹 Add new lead
export const addLead = createAsyncThunk("leads/add", async (leadData, thunkAPI) => {
  try {
    const res = await axios.post("/leads", leadData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to add lead");
  }
});

// 🔹 Update lead
export const updateLead = createAsyncThunk("leads/update", async ({ id, data }, thunkAPI) => {
  try {
    const res = await axios.put(`/leads/${id}`, data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to update lead");
  }
});

// 🔹 Delete lead
export const deleteLead = createAsyncThunk("leads/delete", async (id, thunkAPI) => {
  try {
    await axios.delete(`/leads/${id}`);
    return id; // return deleted id so we can remove from state
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to delete lead");
  }
});

// 🔹 Convert lead → customer
export const convertLead = createAsyncThunk("leads/convert", async (id, thunkAPI) => {
  try {
    const res = await axios.post(`/leads/${id}/convert`);
    return { id, customer: res.data.customer }; // return lead id + new customer
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to convert lead");
  }
});

const leadSlice = createSlice({
  name: "leads",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Fetch
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 Add
      .addCase(addLead.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addLead.rejected, (state, action) => {
        // Do not set global error for add - handle in component popup
      })

      // 🔹 Update
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.items.findIndex((l) => l._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // 🔹 Delete
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l._id !== action.payload);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // 🔹 Convert
      .addCase(convertLead.fulfilled, (state, action) => {
        // remove lead from list once converted
        state.items = state.items.filter((l) => l._id !== action.payload.id);
        // you could also trigger customerSlice update here if needed
      })
      .addCase(convertLead.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = leadSlice.actions;
export default leadSlice.reducer;
