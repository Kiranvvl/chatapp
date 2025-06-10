import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  updateMessage,
  deleteMessage,
} from '../redux/messageSlice';
import { v4 as uuidv4 } from 'uuid';
import { Pencil, Trash2 } from 'lucide-react';

const MessageList = () => {
  const dispatch = useDispatch();
  const { messages, status, error } = useSelector((state) => state.messages);
  const user = useSelector(
    (state) => state.googleWithLogin?.user || state.auth?.user
  );
  const userId = user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [updatedMessageContent, setUpdatedMessageContent] = useState('');

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMessages());
    }
  }, [dispatch, status]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpdateMessage = (messageId, updatedData) => {
    dispatch(updateMessage({ messageId, updatedMessage: updatedData.message }))
      .unwrap()
      .then(() => {
        console.log('Message updated successfully');
        setIsModalOpen(false);
      })
      .catch((error) => {
        console.error('Error updating message:', error);
      });
  };

  const handleDeleteMessage = (messageId) => {
    dispatch(deleteMessage(messageId))
      .unwrap()
      .then(() => {
        console.log('Message deleted successfully');
        setIsModalOpen(false);
      })
      .catch((error) => {
        console.error('Error deleting message:', error);
      });
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

  if (status === 'loading')
    return <div className="text-center text-gray-500">Loading...</div>;

  if (status === 'failed')
    return (
      <div className="text-center text-red-500">
        Error: {error || 'Failed to load messages'}
      </div>
    );

  if (!messages || messages.length === 0)
    return (
      <div className="text-center text-gray-500">No messages available</div>
    );

  return (
    <div
      ref={containerRef}
      className="p-4 bg-white shadow-md rounded-lg max-w-full sm:max-w-md mx-auto overflow-y-auto h-96"
    >
      {messages.map((msg) => (
        <div
          key={uuidv4()}
          className={`mb-3 p-3 rounded-lg border border-gray-200 max-w-[75%] ${
            msg.senderId === userId
              ? 'ml-auto bg-blue-500 text-white'
              : 'mr-auto bg-gray-100 text-gray-900'
          }`}
        >
          <p className="text-sm font-semibold">
            {msg.senderId === userId ? 'You' : msg.senderId || 'Unknown Sender'}
          </p>

          {msg.message && <p className="mb-2">{msg.message}</p>}

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
              />
            </div>
          )}

          {user && (
            <div className="mt-2 flex gap-2">
              {msg.senderId === userId && msg.message && (
                <button
                  onClick={() => openModal(msg, 'edit')}
                  className={`text-sm p-1 rounded transition ${
                    msg.senderId === userId
                      ? 'text-white hover:text-gray-200'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Pencil size={18} />
                </button>
              )}
              <button
                onClick={() => openModal(msg, 'delete')}
                className={`text-sm p-1 rounded transition ${
                  msg.senderId === userId
                    ? 'text-red-300 hover:text-red-200'
                    : 'text-red-500 hover:text-red-700'
                }`}
              >
                <Trash2 size={18} />
              </button>
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
                className={`px-4 py-2 rounded text-white ${
                  actionType === 'delete'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {actionType === 'delete' ? 'Delete' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
