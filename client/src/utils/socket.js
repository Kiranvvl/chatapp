import { io } from 'socket.io-client';
import { API_BASE } from '../config/apiConfig';
import { getAuthToken } from './auth';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) return socket;

  // Get token from either source
  const authToken = getAuthToken(token);

  if (!authToken) {
    console.log('No token found, socket not initialized.');
    return null;
  }

  socket = io(API_BASE, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
    auth: { token: authToken },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
