import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  updateMessage,
  deleteMessage,
  searchMessages,
  setSearchQuery,
  clearSearchResults
} from '../redux/messageSlice';
import { v4 as uuidv4 } from 'uuid';
import { Pencil, Trash2, Search, XCircle } from 'lucide-react';
import { getAuthToken } from '../utils/auth';

const MessageList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [updatedMessageContent, setUpdatedMessageContent] = useState('');
  const [localSearchInput, setLocalSearchInput] = useState('');
  const [deletingMessages, setDeletingMessages] = useState({});

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const dispatch = useDispatch();

  const { messages, status, error, searchQuery, sendError, updateError, deleteError } = useSelector((state) => state.messages);
  // Define messagesToRender once and use it consistently
  const messagesToRender = Array.isArray(messages)
    ? [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];
  useEffect(() => {
    if (sendError) {
      console.error("Send Error:", sendError);
    }
    if (updateError) {
      console.error("Update Error:", updateError);
    }
    if (deleteError) {
      console.error("Delete Error:", deleteError);
    }
  }, [sendError, updateError, deleteError]);



  const user = useSelector(
    (state) => state.googleWithLogin?.user || state.auth?.user
  );


  const userId = user?.id; // Define userId here, after user is determined

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.log('No token found, skipping message fetch');
      return;
    }

    // Only fetch messages if status is 'idle' AND no search query is active
    // 'idle' typically means no operation is pending/in progress.
    if (status === 'idle' && !searchQuery && messages.length === 0) {
      dispatch(fetchMessages());
    }
  }, [dispatch, status, searchQuery, messages.length]);

  useEffect(() => {
    setLocalSearchInput(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    // Scroll only if there are messages
    if (messagesToRender.length > 0) {
      scrollToBottom();
    }
  }, [messagesToRender.length]); // Depend on messagesToRender

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageLoad = () => {
    // A small delay can help ensure the DOM has fully rendered the image
    // and its impact on the layout before scrolling.
    setTimeout(() => {
      scrollToBottom();
    }, 50); // Adjust delay if needed (e.g., 50-200ms)
  };





  const handleUpdateMessage = async (messageId, updatedData) => {
    try {
      await dispatch(updateMessage({ messageId, updatedMessage: updatedData.message })).unwrap();
      console.log('Message updated successfully');
      setIsModalOpen(false);
      // Refresh messages based on current state
      if (searchQuery) {
        await dispatch(searchMessages(searchQuery));
      } else {
        await dispatch(fetchMessages());
      }
    } catch (error) {
      console.error('Error updating message:', error);
      // Show more detailed error message to user
      alert(`Failed to update message: ${error.message || 'Unknown error'}`);
    }
  };

 const handleDeleteMessage = async (messageId) => {
  setDeletingMessages(prev => ({ ...prev, [messageId]: true }));

  try {
    await dispatch(deleteMessage(messageId)).unwrap();
    console.log('Message deleted successfully');
    setIsModalOpen(false);
    
    // Only refresh if in search mode to maintain search results
    if (searchQuery) {
      await dispatch(searchMessages(searchQuery));
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    alert(`Failed to delete message: ${error.message || 'Unknown error'}`);
  } finally {
    setDeletingMessages(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  }
};

  const openModal = (message, type) => {
    setSelectedMessage(message);
    setActionType(type);
    setIsModalOpen(true);
    if (type === 'edit') {
      setUpdatedMessageContent(message.message || '');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
    setActionType(null);
    setUpdatedMessageContent('');
  };

  const handleConfirm = () => {
    if (actionType === 'delete') {
      handleDeleteMessage(selectedMessage.id);
    } else if (actionType === 'edit') {
      if (!selectedMessage.imageUrl && !updatedMessageContent.trim()) {
        alert('Message content cannot be empty');
        return;
      }

      handleUpdateMessage(selectedMessage.id, {
        message: updatedMessageContent,
        imageUrl: selectedMessage.imageUrl,
      });
    }
  };

  const handleSearchChange = (e) => {
    setLocalSearchInput(e.target.value);
  };


  // In your search form handlers:
const handleSearchSubmit = (e) => {
  e.preventDefault();
  const trimmedQuery = localSearchInput.trim();
  if (trimmedQuery) {
    dispatch(setSearchQuery(trimmedQuery));
    dispatch(searchMessages(trimmedQuery));
  } else {
    handleClearSearch();
  }
};

const handleClearSearch = () => {
  dispatch(setSearchQuery(''));
  dispatch(clearSearchResults());
  setLocalSearchInput('');
  // Only fetch if we're not already loading and have no messages
  if (status === 'idle' && messages.length === 0) {
    dispatch(fetchMessages());
  }
};


  if (status === 'loading' && !searchQuery && messagesToRender.length === 0) {
    return <div className="text-center text-gray-500">Loading messages...</div>;
  }

  if (status === 'failed' && !searchQuery && messagesToRender.length === 0) {
    return (
      <div className="text-center text-red-500">
        Error: {typeof error === 'string' ? error : error?.message || 'Failed to load messages.'}
      </div>
    );
  }


  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div
      ref={containerRef}
      className="p-4 bg-white shadow-md rounded-lg max-w-full md:max-w-2xl sm:max-w-md mx-auto overflow-y-auto h-[calc(100vh-80px)] sm:h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] flex flex-col"
    >
      {/* Optional: Display subtle error/warning messages if status is failed but messages are present */}
      {status === 'loading' && (
        <div className="text-center text-gray-500 mb-2">
          Processing...
        </div>
      )}

      {status === 'failed' && messagesToRender.length > 0 && (
        <div className="text-center text-red-500 text-sm mb-2">
          Warning: {typeof error === 'string' ? error : error?.message || 'An operation failed.'}
        </div>
      )}
      {sendError && <div className="text-center text-red-500 text-sm mb-2">Send failed: {sendError.message || JSON.stringify(sendError)}</div>}
      {updateError && <div className="text-center text-red-500 text-sm mb-2">Update failed: {updateError.message || JSON.stringify(updateError)}</div>}
      {deleteError && <div className="text-center text-red-500 text-sm mb-2">Delete failed: {deleteError.message || JSON.stringify(deleteError)}</div>}

      <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search messages..."
            value={localSearchInput}
            onChange={handleSearchChange}
            className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          {localSearchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Search size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto">
        {/* Only show "No messages available" if there are truly no messages and not currently loading or in a failed state WITH messages */}
        {messagesToRender.length === 0 && status !== 'loading' && status !== 'failed' && (
          <div className="text-center text-gray-500">
            {searchQuery ? 'No messages found matching your search.' : 'No messages available.'}
          </div>
        )}

        {messagesToRender.map((msg) => (
          <div
            key={msg.id || uuidv4()} // Use msg.id as key if available, fallback to uuidv4
            className={`mb-4 p-3 rounded-xl border border-gray-200 max-w-[80%] break-words ${msg.senderId === userId
              ? 'ml-auto bg-blue-500 text-white rounded-br-none'
              : 'mr-auto bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
          >
            <p className="text-sm font-semibold">
              {msg.senderId === userId ? 'You' : msg.senderId || 'Unknown Sender'}
            </p>

            {msg.message && (
              <p className="mb-2">
                {typeof msg.message === 'string'
                  ? msg.message
                  : typeof msg.message === 'object' && msg.message !== null
                    ? msg.message.content || msg.message.message || '[Message object]'
                    : '[Invalid Message Type]'}
              </p>
            )}

            {msg.imageUrl && (
              <div className="mt-2 mb-2">
                <img
                  src={msg.imageUrl}
                  alt="Message attachment"
                  className="max-w-full max-h-48 rounded cursor-pointer"
                  onClick={() => window.open(msg.imageUrl, '_blank')}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://via.placeholder.com/150?text=Image+Not+Available';
                  }}
                  onLoad={handleImageLoad}
                />
              </div>
            )}
            {msg.createdAt && (
              <p className={`text-xs mt-1 ${msg.senderId === userId ? 'text-blue-200' : 'text-gray-500'}`}>
                {formatDateTime(msg.createdAt)}
              </p>
            )}

          

            {user && (
              <div className="mt-2 flex gap-2">
                {msg.senderId === userId && (msg.message || msg.imageUrl) && (
                  <button
                    onClick={() => openModal(msg, 'edit')}
                    className={`text-sm p-1 rounded transition ${msg.senderId === userId
                        ? 'text-white hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Pencil size={18} />
                  </button>
                )}
                {deletingMessages[msg.id] ? (
                  <div className="text-sm text-gray-500">Deleting...</div>
                ) : (
                  <button
                    onClick={() => openModal(msg, 'delete')}
                    className={`text-sm p-1 rounded transition ${msg.senderId === userId
                        ? 'text-red-300 hover:text-red-200'
                        : 'text-red-500 hover:text-red-700'
                      }`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">
                {actionType === 'delete' ? 'Delete Message' : 'Edit Message'}
              </h2>
              {actionType === 'edit' ? (
                <>
                  {!selectedMessage.imageUrl && (
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded mb-4"
                      value={updatedMessageContent}
                      onChange={(e) => setUpdatedMessageContent(e.target.value)}
                      placeholder="Edit your message"
                      required
                    />
                  )}
                  {selectedMessage.imageUrl && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Image attachment (cannot be modified):
                      </p>
                      <img
                        src={selectedMessage.imageUrl}
                        alt="Message attachment"
                        className="max-w-full max-h-32 rounded"
                      />
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded mt-2"
                        value={updatedMessageContent}
                        onChange={(e) => setUpdatedMessageContent(e.target.value)}
                        placeholder="Add or edit caption (optional)"
                      />
                    </div>
                  )}
                </>
              ) : (
                <p>Are you sure you want to delete this message?</p>
              )}
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-5 py-2 rounded-lg text-white  transition-colors duration-200 ${actionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {actionType === 'delete' ? 'Delete' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default MessageList;


