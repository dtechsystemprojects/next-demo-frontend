import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import groupReducer from "@/redux/slices/admin/groupSlice";
import permissionReducer from "@/redux/slices/admin/permissionSlice";
import groupAccessReducer from "@/redux/slices/admin/groupAccessSlice";
import userReducer from "./slices/admin/userSlice";
import activityReducer from "./slices/admin/activitySlice";
import emailTemplateReducer from "./slices/admin/emailTemplateSlice";
import smsTemplateReducer from "./slices/admin/smsTemplateSlice";
import frontendUserReducer from "./slices/frontEnd/userSlice";
import pageReducer from "./slices/admin/pageSlice";
import widgetReducer from "./slices/admin/widgetSlice";

export const store = configureStore({
  reducer: {
    widget: widgetReducer,
    page: pageReducer,
    auth: authReducer,
    groups: groupReducer,
    permissions: permissionReducer,
    groupAccess: groupAccessReducer,
    users: userReducer,
    activities: activityReducer,
    emailTemplates: emailTemplateReducer,
    smsTemplates: smsTemplateReducer,
    frontendUser: frontendUserReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
