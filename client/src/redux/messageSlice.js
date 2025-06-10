import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE } from '../config/apiConfig';
import { getAuthToken } from '../utils/auth';

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
      const filteredMessages = response.data.data.filter(
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

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messages: [],
    status: 'idle',
    error: null,
    isUploading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
        state.isUploading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
        state.isUploading = false;
      })
      .addCase(getMessage.fulfilled, (state, action) => {
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
        const updatedMessage = action.payload;
        const index = state.messages.findIndex(
          (msg) => msg.id === updatedMessage.id
        );
        if (index !== -1) {
          state.messages[index] = updatedMessage;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(
          (msg) => msg.id !== action.payload
        );
      });
  },
});

export default messageSlice.reducer;
