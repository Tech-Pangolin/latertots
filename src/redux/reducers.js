import { combineReducers } from 'redux';
import settingsReducer from './slices/settingsSlice';

// ----------------- Authenticated User -----------------

// Todo: create reducer for authenticated user

// ----------------- Async Operations -----------------

// Todo: create reducer for async operations

// ----------------- Root Reducer -----------------
const rootReducer = combineReducers({
  settings: settingsReducer
});

export default rootReducer;