// messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE;

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('User does not exist');

      const response = await axios.get(`${API_BASE}/api/getallmessage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { auth } = getState();
      const userId = auth.user?.id;
      // Ensure response.data.data is an array before filtering
      const allMessages = Array.isArray(response.data.data) ? response.data.data : [];
      const filteredMessages = allMessages.filter(
        (msg) => msg.senderId === userId || msg.receiverId === userId
      );

      return filteredMessages;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (formData, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('User is not authenticated.');
      }

      const response = await axios.post(
        `${API_BASE}/api/postmessage`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error);
      return rejectWithValue(error.response?.data || 'Error sending message');
    }
  }
);

export const getMessage = createAsyncThunk(
  'messages/getMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('User is not authenticated.');
      }

      const response = await axios.get(
        `${API_BASE}/api/getmessage/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error fetching message');
    }
  }
);

export const updateMessage = createAsyncThunk(
  'messages/updateMessage',
  async ({ messageId, updatedMessage }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('User is not authenticated.');
      }

      const response = await axios.put(
        `${API_BASE}/api/updatemessage/${messageId}`,
        { message: updatedMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('User is not authenticated.');
      }

      await axios.delete(`${API_BASE}/api/deletemessage/${messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error deleting message');
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('User is not authenticated.');
      }

      const response = await axios.get(`${API_BASE}/api/searchmessages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query: searchQuery,
        },
      });

      return response.data.data; // Assuming your backend returns data in response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error searching messages');
    }
  }
);




const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messages: [],
    status: 'idle',
    error: null,
    isUploading: false,
    searchQuery: '', // New state to hold the current search query
  },
  reducers: {
 setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearSearchResults: (state) => {
      state.messages = []; // Clear messages when search results are cleared
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Ensure action.payload is an array or default to an empty array
        state.messages = Array.isArray(action.payload) ? action.payload : [];
        state.error = null; // Clear error on success
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.messages = []; // Ensure messages is an empty array on failure
      })
      .addCase(sendMessage.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Ensure messages is an array before pushing
        if (Array.isArray(state.messages)) {
          state.messages.push(action.payload);
        } else {
          state.messages = [action.payload]; // Initialize if not an array
        }
        state.isUploading = false;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
        state.isUploading = false;
      })
      .addCase(getMessage.fulfilled, (state, action) => {
        // Ensure messages is an array before manipulating
        if (!Array.isArray(state.messages)) {
          state.messages = [];
        }
        const index = state.messages.findIndex(
          (msg) => msg.id === action.payload.id
        );
        if (index !== -1) {
          state.messages[index] = action.payload;
        } else {
          state.messages.push(action.payload);
        }
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        // Ensure messages is an array before manipulating
        if (!Array.isArray(state.messages)) {
          state.messages = [];
        }
        const updatedMessage = action.payload;
        const index = state.messages.findIndex(
          (msg) => msg.id === updatedMessage.id
        );
        if (index !== -1) {
          state.messages[index] = updatedMessage;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        // Ensure messages is an array before filtering
        if (Array.isArray(state.messages)) {
          state.messages = state.messages.filter(
            (msg) => msg.id !== action.payload
          );
        } else {
          state.messages = [];
        }

      })
  .addCase(searchMessages.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.messages = [];
      })
 
  },
});

export const { setSearchQuery, clearSearchResults } = messageSlice.actions;
export default messageSlice.reducer;


