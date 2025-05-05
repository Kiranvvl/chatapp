// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { API_BASE } from '../config/apiConfig';

// // Google login action
// export const googleLogin = createAsyncThunk(
//   'auth/googleLogin',
//   async (credential, thunkAPI) => {
//     try {
//       const response = await fetch(`${API_BASE}/api/auth/google-login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ credential }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Google login failed');
//       }

//       localStorage.setItem('token', data.token);
//       localStorage.setItem('user', JSON.stringify(data.user));

//       return { token: data.token, user: data.user };
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.message || String(error));
//     }
//   }
// );

// // Logout action
// export const googleLogout = createAsyncThunk(
//   'auth/googleLogout',
//   async (_, thunkAPI) => {
//     try {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       return null;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.message || String(error));
//     }
//   }
// );

// const googleWithLoginSlice = createSlice({
//   name: 'googleWithLogin',
//   initialState: {
//     isAuthenticated: !!localStorage.getItem('token'), // Fixed spelling and added initial check
//     token: localStorage.getItem('token') || null,
//     user: localStorage.getItem('user')
//       ? JSON.parse(localStorage.getItem('user'))
//       : null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     syncWithAuth: (state, action) => {
//       state.isAuthenticated = action.payload.isAuthenticated;
//       state.token = action.payload.token;
//       state.user = action.payload.user;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(googleLogin.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       // Inside extraReducers -> .addCase(googleLogin.fulfilled)
//       .addCase(googleLogin.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = true;
//         state.token = action.payload.token;
//         state.user = action.payload.user;

//         localStorage.setItem('token', action.payload.token);
//         localStorage.setItem('user', JSON.stringify(action.payload.user));
//       })

//       .addCase(googleLogin.rejected, (state, action) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//         state.error = action.payload;
//       })
//       .addCase(googleLogout.fulfilled, (state) => {
//         state.loading = false;
//         state.isAuthenticated = false; // Add this line
//         state.token = null;
//         state.user = null;
//       });
//   },
// });

// export default googleWithLoginSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../config/apiConfig';

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const googleLogout = createAsyncThunk('auth/googleLogout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
});

const initialState = {
  isAuthenticated: !!localStorage.getItem('token'),
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,
};

const googleWithLoginSlice = createSlice({
  name: 'googleWithLogin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = payload.token;
        state.user = payload.user;
      })
      .addCase(googleLogin.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(googleLogout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export default googleWithLoginSlice.reducer;
