// src/redux/noteSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// Create Note
export const createNote = createAsyncThunk(
  "notes/createNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post("/notes", noteData);
      return data; // { _id, content, relatedModel, relatedTo, ... }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Get Notes (optionally filtered by relatedModel + relatedTo)
export const getNotes = createAsyncThunk(
  "notes/getNotes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/notes", { params });
      return data; // array
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update Note
export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/notes/${id}`, { content });
      return data; // updated note
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete Note
export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/notes/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const capModel = (m) =>
  typeof m === "string" ? m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() : m;

const keyFor = (relatedModel, relatedTo) =>
  `${capModel(relatedModel)}:${relatedTo}`;

const noteSlice = createSlice({
  name: "notes",
  initialState: {
    // Global, unfiltered list (for Notes tab)
    items: [],
    // Per-entity buckets: { "Lead:123": [...], "Customer:456": [...] }
    byRef: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createNote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.loading = false;
        const n = action.payload;
        // put into global list (top)
        state.items.unshift(n);
        // put into scoped bucket
        const k = keyFor(n.relatedModel, n.relatedTo);
        if (!state.byRef[k]) state.byRef[k] = [];
        state.byRef[k].unshift(n);
      })
      .addCase(createNote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get
      .addCase(getNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNotes.fulfilled, (state, action) => {
        state.loading = false;
        const notesArr = action.payload || [];
        const arg = action.meta?.arg || {};
        if (arg.relatedModel && arg.relatedTo) {
          const k = keyFor(arg.relatedModel, arg.relatedTo);
          state.byRef[k] = notesArr;
        } else {
          // Global fetch
          state.items = notesArr;
        }
      })
      .addCase(getNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateNote.fulfilled, (state, action) => {
        const n = action.payload;
        // global
        state.items = state.items.map((x) => (x._id === n._id ? n : x));
        // scoped
        const k = keyFor(n.relatedModel, n.relatedTo);
        if (state.byRef[k]) {
          state.byRef[k] = state.byRef[k].map((x) => (x._id === n._id ? n : x));
        }
      })
      // Delete
      .addCase(deleteNote.fulfilled, (state, action) => {
        const id = action.payload;
        // remove from global
        state.items = state.items.filter((x) => x._id !== id);
        // remove from all buckets (cheap but safe)
        Object.keys(state.byRef).forEach((k) => {
          state.byRef[k] = state.byRef[k].filter((x) => x._id !== id);
        });
      });
  },
});

export default noteSlice.reducer;