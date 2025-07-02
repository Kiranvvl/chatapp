import { io } from 'socket.io-client';
import { getAuthToken } from './auth';


const API_BASE =  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5000'; // Fallback to local server if not set
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
