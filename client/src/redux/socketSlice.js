import { createSlice } from '@reduxjs/toolkit';

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    isConnected: false,
    socketId: null,
  },
  reducers: {
    setSocketConnection: (state, action) => {
      state.isConnected = true;
      state.socketId = action.payload;
    },
    disconnectSocket: (state) => {
      state.isConnected = false;
      state.socketId = null;
    },
    connectSocket: (state) => {
      state.isConnected = true;
    },
  },
});

export const { setSocketConnection, disconnectSocket, connectSocket } =
  socketSlice.actions;
export default socketSlice.reducer;
