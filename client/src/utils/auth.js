import axios from 'axios';
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
