import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: '07:00',
      endTime: '19:00',
      overlap: false
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
    }
  },
});

export const {
  setBusinessHours_Days, 
  setBusinessHours_StartTime, 
  setBusinessHours_EndTime, 
  setBusinessHours_Overlap 
} = settingsSlice.actions;

export default settingsSlice.reducer;