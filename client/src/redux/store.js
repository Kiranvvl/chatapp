import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice'; 
import messagesReducer from './messageSlice';
import socketReducer from './socketSlice';
import googleWithLoginReducer from './googleWithLoginSlice';

// Persist Configurations
const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['socket', 'googleWithLogin'], // Exclude socket from persistence
};

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token'], // Persist only token
};

const messagesPersistConfig = {
  key: 'messages',
  storage,
  whitelist: ['allMessages'],
};

const googleWithLoginPersistConfig = {
  key: 'googleWithLogin',
  storage,
  whitelist: ['token'], // Avoid duplication with auth
};

// Root Reducer with Persisted Slices
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  messages: persistReducer(messagesPersistConfig, messagesReducer),
  googleWithLogin: persistReducer(
    googleWithLoginPersistConfig,
    googleWithLoginReducer
  ),
  socket: socketReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store Configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
