import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: '07:00',
      endTime: '19:00',
      overlap: false
    },
    notifications: {
      enabled: true,
      systemNotifications: true,
      adminNotifications: true,
      autoExpirationDays: 30,
      capacityWarningThresholdPercentage: 80
    }
  },
  reducers: {
    setBusinessHours_Days(state, action) {
      state.businessHours.daysOfWeek = action.payload;
    },
    setBusinessHours_StartTime(state, action) {
      state.businessHours.startTime = action.payload;
    },
    setBusinessHours_EndTime(state, action) {
      state.businessHours.endTime = action.payload;
    },
    setBusinessHours_Overlap(state, action) {
      state.businessHours.overlap = action.payload;
    },
    setNotificationSettings(state, action) {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setNotificationEnabled(state, action) {
      state.notifications.enabled = action.payload;
    },
    setSystemNotifications(state, action) {
      state.notifications.systemNotifications = action.payload;
    },
    setAdminNotifications(state, action) {
      state.notifications.adminNotifications = action.payload;
    },
    setAutoExpirationDays(state, action) {
      state.notifications.autoExpirationDays = action.payload;
    },
    setCapacityWarningThresholdPercentage(state, action) {
      state.notifications.capacityWarningThresholdPercentage = action.payload;
    }
  },
});

export const {
  setBusinessHours_Days, 
  setBusinessHours_StartTime, 
  setBusinessHours_EndTime, 
  setBusinessHours_Overlap,
  setNotificationSettings,
  setNotificationEnabled,
  setSystemNotifications,
  setAdminNotifications,
  setAutoExpirationDays,
  setCapacityWarningThresholdPercentage
} = settingsSlice.actions;

export default settingsSlice.reducer;