import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import usersReducer from "./userSlice";
import leadReducer from "./leadSlice";
import dealReducer from "./dealSlice";
import customerReducer from "./customerSlice";
import taskReducer from "./taskSlice";
import noteReducer from "./noteSlice"
import stageReducer from "./stageSlice"
import logReducer from "./logSlice"
import reportReducer from "./reportSlice"
import emailTemplateReducer from "./emailTemplateSlice"
import notificationReducer from "./notificationSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    leads: leadReducer,
    deals: dealReducer,
    customers: customerReducer,
    tasks: taskReducer,
    notes: noteReducer,
    stages: stageReducer,
    logs: logReducer,
    reports: reportReducer,
    emailTemplates: emailTemplateReducer,
    notifications: notificationReducer
  },
});
