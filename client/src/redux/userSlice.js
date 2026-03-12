// src/features/users/usersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// Fetch all users (Admin only)
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // already array
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
    }
  }
);

// Add new user (Admin only)
export const addUser = createAsyncThunk(
  "users/addUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const res = await axios.post("/users", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.user; // unwrap the user object
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add user");
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      console.log("Making PUT request:", `/users/${id}`, updates, token);
      const res = await axios.put(`/users/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res.data);
      
      return res.data.user; // unwrap updated user
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update user");
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      await axios.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id; // return deleted user id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete user");
    }
  }
);

// ✅ Change password (Logged-in user)
export const changePassword = createAsyncThunk(
  "users/changePassword",
  async ({ currentPassword, newPassword, confirmPassword }, { getState, rejectWithValue }) => {
    try {
      console.log("Payload being sent:", { currentPassword, newPassword, confirmPassword });

      const res = await axios.patch(
        "/users/change-password",
        { currentPassword, newPassword, confirmPassword },
        {
          headers: {
            Authorization: `Bearer ${getState().auth.token}`, // <-- important
          },
        }
      );
      console.log("Backend response:", res.data);
      return res.data.message;
    } catch (err) {
      console.error("Change password error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || "Failed to change password");
    }
  }
);


const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    error: null,
    successMessage: null, // ✅ added to show password change success
  },
  reducers: {
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add
    builder
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u._id === action.payload._id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ✅ Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload; // message from backend
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSuccess } = usersSlice.actions;
export default usersSlice.reducer;