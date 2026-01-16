// src/redux/stageSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// Fetch all stages
export const fetchStages = createAsyncThunk("stages/fetchAll", async () => {
  const { data } = await axios.get("/stages");
  return data;
});

// Create stage
export const createStage = createAsyncThunk("stages/create", async (stageData) => {
  const { data } = await axios.post("/stages", stageData);
  return data;
});

// Update stage
export const updateStage = createAsyncThunk("stages/update", async ({ id, stageData }) => {
  const { data } = await axios.put(`/stages/${id}`, stageData);
  return data;
});

// Delete stage
export const deleteStage = createAsyncThunk("stages/delete", async (id) => {
  await axios.delete(`/stages/${id}`);
  return id;
});

const stageSlice = createSlice({
  name: "stages",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchStages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStages.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchStages.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })

      // Create
      .addCase(createStage.fulfilled, (state, action) => { state.items.push(action.payload); })
      // Note: Not setting error for create operations - handled locally in component

      // Update
      .addCase(updateStage.fulfilled, (state, action) => {
        state.items = state.items.map((stage) => stage._id === action.payload._id ? action.payload : stage);
      })
      // Note: Not setting error for update operations - handled locally in component

      // Delete
      .addCase(deleteStage.pending, (state) => { /* Loading handled locally */ })
      .addCase(deleteStage.fulfilled, (state, action) => {
        state.items = state.items.filter((stage) => stage._id !== action.payload);
      })
      // Note: Not setting error for delete operations - handled locally in component
  },
});

export default stageSlice.reducer;