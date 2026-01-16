import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// Async thunks
export const fetchEmailTemplates = createAsyncThunk(
  "emailTemplates/fetchEmailTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/email-templates");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch templates");
    }
  }
);

export const createEmailTemplate = createAsyncThunk(
  "emailTemplates/createEmailTemplate",
  async (template, { rejectWithValue }) => {
    try {
      const response = await axios.post("/email-templates", template);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create template");
    }
  }
);

export const updateEmailTemplate = createAsyncThunk(
  "emailTemplates/updateEmailTemplate",
  async ({ id, template }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/email-templates/${id}`, template);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update template");
    }
  }
);

export const deleteEmailTemplate = createAsyncThunk(
  "emailTemplates/deleteEmailTemplate",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/email-templates/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete template");
    }
  }
);

// Slice
const emailTemplateSlice = createSlice({
  name: "emailTemplates",
  initialState: {
    templates: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create template
      .addCase(createEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates.push(action.payload);
      })
      .addCase(createEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update template
      .addCase(updateEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
      })
      .addCase(updateEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete template
      .addCase(deleteEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter(t => t._id !== action.payload);
      })
      .addCase(deleteEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default emailTemplateSlice.reducer;