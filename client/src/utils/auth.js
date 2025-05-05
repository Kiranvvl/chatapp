// export const setAuthToken = (userToken) => {
//   try {
//     // Handle null/undefined case first
//     if (userToken === null || userToken === undefined) {
//       localStorage.removeItem('token');
//       return;
//     }

import axios from 'axios';

//     let tokenToStore = '';

//     if (typeof userToken === 'object' && userToken.token) {
//       tokenToStore = userToken.token;
//     } else if (typeof userToken === 'string') {
//       tokenToStore = userToken;
//     } else {
//       throw new Error('Invalid token format');
//     }

//     localStorage.setItem('token', tokenToStore);
//     console.log('Token saved successfully:', tokenToStore);
//   } catch (error) {
//     console.error('Error handling token:', error);
//   }
// };

// export const getAuthToken = (reduxToken) => {
//   return reduxToken || localStorage.getItem('token');
// };

// export const clearAuthToken = () => {
//   localStorage.removeItem('token');
// };

// auth.js
export const getAuthToken = () => {
  // Check sessionStorage first, then localStorage
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

export const setAuthToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
};
