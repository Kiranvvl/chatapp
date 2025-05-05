import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/auth.js';
import { connectSocket } from './socketSlice.js';
import { API_BASE } from '../config/apiConfig.js';

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/api/register`, {
        username,
        email,
        password,
      });

      if (!response || !response.data || !response.data.user) {
        throw new Error('Invalid server response: User data not found');
      }

      const token = response.data.token; // Ensure token exists
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

// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async ({ email, password }, { dispatch, rejectWithValue }) => {
//     try {
//       const response = await axios.post(`${API_BASE}/api/login`, {
//         email,
//         password,
//       });

//       const token = response.data?.token;
//       const user = response.data?.user;

//       if (!token || !user) {
//         throw new Error('Invalid server response: Missing token or user data');
//       }

//       setAuthToken(token);
//       dispatch(connectSocket());
//       return { token, user };
//     } catch (error) {
//       console.error('Login error:', error.response?.data || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Login failed');
//     }
//   }
// );

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

      setAuthToken(token, rememberMe); // Pass rememberMe here
      dispatch(connectSocket());
      return { token, user };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
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

      if (!response || !response.data || !response.data.data) {
        throw new Error('Invalid server response: User data not found');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get user error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user'
      );
    }
  }
);

// Add this to your authSlice.js
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
        `${API_BASE}/api/reset-password/${token}`, // Remove the ":token" literal
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
          'Failed to reset password. Please try again.'
      );
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/api/verify/${token}`);
      if (response.data.success) {
        return response.data; // This should include user data
      }
      throw new Error(response.data.message || 'Verification failed');
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Verification failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
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
      sessionStorage.clear();
      clearAuthToken(); // Clear the token from axios headers
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true; // Ensure user is authenticated
        state.verificationMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred';
      })
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user';
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred';
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'An error occurred';
      })
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.verificationMessage = action.payload.message;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
