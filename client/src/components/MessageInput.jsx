
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '../redux/messageSlice';
import { logout } from '../redux/authSlice';
import { googleLogout } from '../redux/googleWithLoginSlice';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

const MessageInput = () => {
  const [message, setMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user info from both possible sources
  const authUser = useSelector((state) => state.auth?.user);
  const googleUser = useSelector((state) => state.googleWithLogin?.user);
 


  // Determine which user info to use
  
  const isAuthenticated = useSelector((state) => {
  // First check if we have a token
  const token = getAuthToken();
  // Then check the Redux state
  return !!token && (state.googleWithLogin?.isAuthenticated || state.auth?.isAuthenticated);
})
  
  const user = authUser || googleUser;
  const username = user?.username || user?.name; // Google login might use 'name' instead of 'username'

  

  useEffect(() => {
  const token = getAuthToken();
  if (!isAuthenticated || !token) {
    navigate('/formToggle');
  }
}, [isAuthenticated, navigate]);



  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image (JPEG, PNG, GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImage(file);
    }
  };

  

  const handleRemoveImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated || !user?.id) {
      alert('Please log in to send messages.');
      navigate('/formToggle');
      return;
    }

    const parsedReceiverId = parseInt(receiverId.trim());
    if (isNaN(parsedReceiverId) || parsedReceiverId <= 0) {
      alert('Please enter a valid positive receiver ID.');
      return;
    }

    if (!message?.trim() && !image) {
      alert('Please enter a message or upload an image.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('senderId', user.id.toString());
      formData.append('receiverId', parsedReceiverId.toString());

      if (message?.trim()) {
        formData.append('message', message.trim());
      }

      if (image) {
        formData.append('image', image);
      }

      const resultAction = await dispatch(sendMessage(formData));

      if (sendMessage.fulfilled.match(resultAction)) {
        setMessage('');
        setReceiverId('');
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = resultAction.payload || resultAction.error;
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error?.message || 'Failed to send message');

      // Check for unauthorized error
      if (error?.status === 401 || error?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsUploading(false);
    }
  };

  

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // Small timeout to ensure UI updates
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Redirect
    navigate('/formToggle', { replace: true });

    try {
      await Promise.all([dispatch(logout()), dispatch(googleLogout())]);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
  //  <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
  //     {/* Display username when logged in */}
  //     {isAuthenticated && username && (
  //       <div className="bg-blue-100 p-3 rounded-lg">
  //         <p className="text-blue-800 font-medium">
  //           Logged in as: <span className="font-bold">{username}</span>
  //         </p>
  //       </div>
  //     )}

  //     <div className="flex flex-col sm:flex-row gap-2">
  //       <input
  //         type="number"
  //         value={receiverId}
  //         onChange={(e) => setReceiverId(e.target.value)}
  //         className="border p-2 rounded w-full"
  //         placeholder="Receiver ID"
  //         min="1"
  //       />
  //       <input
  //         type="text"
  //         value={message}
  //         onChange={(e) => setMessage(e.target.value)}
  //         className="border p-2 rounded w-full"
  //         placeholder="Type a message..."
  //       />
  //     </div>

  //     <div className="flex flex-col gap-2">
  //       <div className="flex items-center gap-2">
  //         <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded cursor-pointer transition-colors">
  //           <span>{image ? 'Change Image' : 'Upload Image'}</span>
  //           <input
  //             type="file"
  //             ref={fileInputRef}
  //             onChange={handleImageChange}
  //             accept="image/jpeg, image/png, image/gif"
  //             className="hidden"
  //           />
  //         </label>
  //         {image && (
  //           <button
  //             onClick={handleRemoveImage}
  //             className="bg-red-200 hover:bg-red-300 text-red-800 px-4 py-2 rounded transition-colors"
  //           >
  //             Remove
  //           </button>
  //         )}
  //       </div>
  //       {image && (
  //         <div className="mt-2">
  //           <p className="text-sm text-gray-600">Selected: {image.name}</p>
  //           <div className="mt-1 w-32 h-32 border rounded overflow-hidden">
  //             <img
  //               src={URL.createObjectURL(image)}
  //               alt="Preview"
  //               className="w-full h-full object-cover"
  //             />
  //           </div>
  //         </div>
  //       )}
  //     </div>

  //     <div className="flex flex-col sm:flex-row gap-2">
  //       <button
  //         onClick={handleSendMessage}
  //         className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto cursor-pointer transition-colors disabled:opacity-50"
  //         disabled={!isAuthenticated || isUploading}
  //       >
  //         {isUploading ? 'Sending...' : 'Send'}
  //       </button>
  //       <button
  //         onClick={handleLogout}
  //         className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full sm:w-auto transition-colors disabled:opacity-50"
  //         disabled={isLoggingOut}
  //       >
  //         {isLoggingOut ? 'Logging out...' : 'Logout'}
  //       </button>
  //     </div>
  //   </div>

  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4">
      {/* User info bar */}
      {isAuthenticated && username && (
        <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-700 font-medium">
            👤 <span className="font-semibold">{username}</span>
          </p>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}

      {/* Message input area */}
      <div className="flex flex-col space-y-3">
        {/* Receiver ID input */}
        <div className="relative">
          <input
            type="number"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Receiver ID"
            min="1"
          />
          <span className="absolute right-3 top-3 text-gray-400 text-sm">ID</span>
        </div>

        {/* Message input and image upload */}
        <div className="flex items-end gap-2">
          <div className="flex-grow relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Type your message..."
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full cursor-pointer transition-colors">
                <span className="sr-only">Upload Image</span>
                📎
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png, image/gif"
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center"
            disabled={!isAuthenticated || isUploading}
            style={{ minWidth: '50px' }}
          >
            {isUploading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>

        {/* Image preview */}
        {image && (
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 rounded overflow-hidden">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {image.name}
              </span>
            </div>
            <button
              onClick={handleRemoveImage}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;