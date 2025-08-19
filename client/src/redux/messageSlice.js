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

      // Return all messages without filtering here
      // Let the component handle filtering based on user
      return Array.isArray(response.data.data) ? response.data.data : [];
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

      return messageId; // Assuming your backend returns the deleted message ID
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

      return response.data.data || []; // Assuming your backend returns data in response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error searching messages');
    }
  }
);




const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messages: [],
    filteredMessages: [], // Add this new state
    status: 'idle',
    error: null,
    isUploading: false,
    sendError: null,    // specific error for send message
    updateError: null,  // specific error for update message
    deleteError: null,  // specific error for delete message
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
      state.sendError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.sendError = null;
      state.updateError = null;
      state.deleteError = null;
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
        state.messages = action.payload; // payload is already filtered
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isUploading = true;
        state.sendError = null;
      })
      
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Add the new message to the existing array
        state.messages = [...state.messages, action.payload];
        state.isUploading = false;
        state.sendError = null;
      })

      .addCase(sendMessage.rejected, (state, action) => {
        state.isUploading = false;
        state.sendError = action.payload;

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
      .addCase(getMessage.rejected, (state, action) => {
        state.error = action.payload;
        console.error('Error fetching message:', action.payload);
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
        state.updateError = null; // Clear update error on success
      })
      .addCase(updateMessage.rejected, (state, action) => {
        state.updateError = action.payload;
      })
      

      .addCase(deleteMessage.fulfilled, (state, action) => {
        // Filter out the deleted message without re-fetching
        state.messages = state.messages.filter(msg => msg.id !== action.payload);
        state.deleteError = null;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.deleteError = action.payload;
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


