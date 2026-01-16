// src/redux/slices/customerSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios"; // your configured axios instance
import { convertLead } from "./leadSlice"; // 👈 import convertLead thunk

// Create Customer
export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData, { rejectWithValue }) => {
    try {
      const res = await axios.post("/customer", customerData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Get all Customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/customer");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Get Customer by ID
export const fetchCustomerById = createAsyncThunk(
  "customers/fetchCustomerById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/customer/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update Customer
export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async ({ id, customer }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/customer/${id}`, customer);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete Customer
export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/customer/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [],
    customer: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCustomer: (state) => {
      state.customer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch All
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch One
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.customer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.map((c) =>
          c._id === action.payload._id ? action.payload : c
        );
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 👇 Lead → Customer conversion
      .addCase(convertLead.fulfilled, (state, action) => {
        state.customers.push(action.payload.customer); // ✅ fixed
      });
  },
});

export const { clearCustomer } = customerSlice.actions;
export default customerSlice.reducer;