import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/auth.js';
import { connectSocket } from './socketSlice.js';


const API_BASE = import.meta.env.VITE_API_BASE;

  export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/register`, {
        username,
        email,
        password,
      });

      if (!response?.data?.user) {
        throw new Error('Invalid server response: User data not found');
      }

      const token = response.data.token;
      if (token) {
        setAuthToken(token);
      }

      return {
        user: response.data.user,
        message: response.data.message || 'Registration successful',
      };
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to register. Please try again.'
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        email,
        password,
      });

      const token = response.data?.token;
      const user = response.data?.user;

      if (!token || !user) {
        throw new Error('Invalid server response: Missing token or user data');
      }

      setAuthToken(token, rememberMe);
      localStorage.setItem('user', JSON.stringify(user)); // Move here for consistency
      dispatch(connectSocket());

      return { token, user };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    }
  }
);

export const getUser = createAsyncThunk(
  'auth/getUser',
  async (userId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE}/api/getdata/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response?.data?.data) {
        throw new Error('Invalid server response: User data not found');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error.message);
      // Clear auth if token is invalid
      if (error.response?.status === 401) {
        clearAuthToken();
      }
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user'
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/forgot-password`, {
        email,
      });

      return {
        message: response.data.message || 'Reset link sent to your email',
      };
    } catch (error) {
      console.error(
        'Forgot password error:',
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to send reset link. Please try again.'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/reset-password/${token}`,
        { newPassword }
      );

      return {
        message: response.data.message || 'Password reset successfully',
      };
    } catch (error) {
      console.error(
        'Reset password error:',
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.message ||
          'Failed to reset password. The link may have expired.'
      );
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/api/verify/${token}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Verification failed');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Verification failed. The link may have expired.'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: !!getAuthToken(),
    user: localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null,
    isLoading: false,
    error: null,
    message: null,
    verificationMessage: null,
    success: false,
  },
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.verificationMessage = null;
      state.isLoading = false;
      state.success = false;
      setAuthToken(null); // Clear the token
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Also clear user
      sessionStorage.clear();
      clearAuthToken(); // Clear the token from axios headers
    },
    initializeAuth(state) {
      const token = getAuthToken();
      const user = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user'))
        : null;

      state.isAuthenticated = !!(token && user);
      state.user = user;
    },
    clearMessages(state) {
      state.error = null;
      state.message = null;
      state.verificationMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.verificationMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user)); // Persist user
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload)); // Persist user
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user';
        state.isAuthenticated = false;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to send reset link';
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to reset password';
      })
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.verificationMessage = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.verificationMessage = action.payload.message;
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Verification failed';
      });
  },
});

export const { logout, initializeAuth, clearMessages } = authSlice.actions;
export default authSlice.reducer;
