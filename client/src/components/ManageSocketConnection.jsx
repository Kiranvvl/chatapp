import { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setSocketConnection, disconnectSocket } from '../redux/socketSlice';
import {
  initializeSocket,
  disconnectSocket as disconnect,
} from '../utils/socket';

const ManageSocketConnection = () => {
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => {
    // Check both auth sources
    if (state.googleWithLogin?.isAuthenticated) {
      return {
        isAuthenticated: state.googleWithLogin.isAuthenticated,
        user: state.googleWithLogin.user,
      };
    }
    return {
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
    };
  }, shallowEqual);

  const token = user?.token;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.debug(
        'User not authenticated or token missing, skipping socket initialization.'
      );
      return;
    }

    let socket;
    try {
      socket = initializeSocket(token);
      if (!socket) return;

      const onConnect = () => {
        console.debug('Socket connected:', socket.id);
        dispatch(setSocketConnection(socket.id));
      };

      const onDisconnect = () => {
        console.debug('Socket disconnected');
        dispatch(disconnectSocket());
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      if (!socket.connected) {
        socket.connect();
      }
    } catch (error) {
      console.error('Socket connection error:', error);
      return;
    }

    return () => {
      console.debug('Cleaning up socket connection');
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        disconnect();
      }
    };
  }, [dispatch, isAuthenticated, token]);

  return null;
};

export default ManageSocketConnection;
