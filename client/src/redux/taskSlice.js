// src/redux/slices/taskSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../api/axios";

// Fetch all tasks
export const fetchTasks = createAsyncThunk("tasks/fetchTasks", async (_, thunkAPI) => {
  try {
    const res = await axios.get("/task");
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data.message);
  }
});

// Create task
export const createTask = createAsyncThunk("tasks/createTask", async (taskData, thunkAPI) => {
  try {
    const res = await axios.post("/task", taskData);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data.message);
  }
});

// Update task
export const updateTask = createAsyncThunk("tasks/updateTask", async ({ id, task }, thunkAPI) => {
  try {
    const res = await axios.put(`/task/${id}`, task);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data.message);
  }
});

// Delete task
export const deleteTask = createAsyncThunk("tasks/deleteTask", async (id, thunkAPI) => {
  try {
    await axios.delete(`/task/${id}`);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response.data.message);
  }
});

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })

      // Update
      .addCase(updateTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        );
      })

      // Delete
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task._id !== action.payload);
      });
  },
});

export default taskSlice.reducer;