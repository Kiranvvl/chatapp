// import { useState, useRef, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { sendMessage } from '../redux/messageSlice';
// import { logout } from '../redux/authSlice';
// import { googleLogout } from '../redux/googleWithLoginSlice';
// import { useNavigate } from 'react-router-dom';

// const MessageInput = () => {
//   const [message, setMessage] = useState('');
//   const [receiverId, setReceiverId] = useState('');
//   const [image, setImage] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const fileInputRef = useRef(null);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   // Get user info from both possible sources
//   const authUser = useSelector((state) => state.auth?.user);
//   const googleUser = useSelector((state) => state.googleWithLogin?.user);
//   const isAuthenticated = useSelector(
//     (state) =>
//       state.googleWithLogin?.isAuthenticated || state.auth?.isAuthenticated
//   );

//   // Determine which user info to use
//   const user = authUser || googleUser;
//   const username = user?.username || user?.name; // Google login might use 'name' instead of 'username'

//   // Add useEffect to check authentication status
//   useEffect(() => {
//     if (!isAuthenticated) {
//       navigate('/formToggle');
//     }
//   }, [isAuthenticated, navigate]);

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
//       if (!validTypes.includes(file.type)) {
//         alert('Please upload a valid image (JPEG, PNG, GIF)');
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         alert('Image size should be less than 5MB');
//         return;
//       }
//       setImage(file);
//     }
//   };

//   const handleRemoveImage = () => {
//     setImage(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!isAuthenticated || !user?.id) {
//       alert('Please log in to send messages.');
//       navigate('/formToggle');
//       return;
//     }

//     const parsedReceiverId = parseInt(receiverId.trim());
//     if (isNaN(parsedReceiverId) || parsedReceiverId <= 0) {
//       alert('Please enter a valid positive receiver ID.');
//       return;
//     }

//     if (!message?.trim() && !image) {
//       alert('Please enter a message or upload an image.');
//       return;
//     }

//     setIsUploading(true);

//     try {
//       const formData = new FormData();
//       formData.append('senderId', user.id.toString());
//       formData.append('receiverId', parsedReceiverId.toString());

//       if (message?.trim()) {
//         formData.append('message', message.trim());
//       }

//       if (image) {
//         formData.append('image', image);
//       }

//       const resultAction = await dispatch(sendMessage(formData));

//       if (sendMessage.fulfilled.match(resultAction)) {
//         setMessage('');
//         setReceiverId('');
//         setImage(null);
//         if (fileInputRef.current) {
//           fileInputRef.current.value = '';
//         }
//       } else {
//         const error = resultAction.payload || resultAction.error;
//         throw error;
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//       alert(error?.message || 'Failed to send message');

//       // Check for unauthorized error
//       if (error?.status === 401 || error?.response?.status === 401) {
//         handleLogout();
//       }
//     } finally {
//       setIsUploading(false);
//     }
//   };

 

//   const handleLogout = async () => {
//     setIsLoggingOut(true);

//     // Small timeout to ensure UI updates
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     // Redirect
//     navigate('/formToggle', { replace: true });

//     try {
//       await Promise.all([dispatch(logout()), dispatch(googleLogout())]);
//     } catch (error) {
//       console.error('Logout error:', error);
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
//       {/* Display username when logged in */}
//       {isAuthenticated && username && (
//         <div className="bg-blue-100 p-3 rounded-lg">
//           <p className="text-blue-800 font-medium">
//             Logged in as: <span className="font-bold">{username}</span>
//           </p>
//         </div>
//       )}

//       <div className="flex flex-col sm:flex-row gap-2">
//         <input
//           type="number"
//           value={receiverId}
//           onChange={(e) => setReceiverId(e.target.value)}
//           className="border p-2 rounded w-full"
//           placeholder="Receiver ID"
//           min="1"
//         />
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           className="border p-2 rounded w-full"
//           placeholder="Type a message..."
//         />
//       </div>

//       <div className="flex flex-col gap-2">
//         <div className="flex items-center gap-2">
//           <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded cursor-pointer transition-colors">
//             <span>{image ? 'Change Image' : 'Upload Image'}</span>
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleImageChange}
//               accept="image/jpeg, image/png, image/gif"
//               className="hidden"
//             />
//           </label>
//           {image && (
//             <button
//               onClick={handleRemoveImage}
//               className="bg-red-200 hover:bg-red-300 text-red-800 px-4 py-2 rounded transition-colors"
//             >
//               Remove
//             </button>
//           )}
//         </div>
//         {image && (
//           <div className="mt-2">
//             <p className="text-sm text-gray-600">Selected: {image.name}</p>
//             <div className="mt-1 w-32 h-32 border rounded overflow-hidden">
//               <img
//                 src={URL.createObjectURL(image)}
//                 alt="Preview"
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="flex flex-col sm:flex-row gap-2">
//         <button
//           onClick={handleSendMessage}
//           className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto cursor-pointer transition-colors disabled:opacity-50"
//           disabled={!isAuthenticated || isUploading}
//         >
//           {isUploading ? 'Sending...' : 'Send'}
//         </button>
//         <button
//           onClick={handleLogout}
//           className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full sm:w-auto transition-colors disabled:opacity-50"
//           disabled={isLoggingOut}
//         >
//           {isLoggingOut ? 'Logging out...' : 'Logout'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default MessageInput;
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '../redux/messageSlice';
import { logout } from '../redux/authSlice';
import { googleLogout } from '../redux/googleWithLoginSlice';
import { useNavigate } from 'react-router-dom';

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
  const isAuthenticated = useSelector(
    (state) =>
      state.googleWithLogin?.isAuthenticated || state.auth?.isAuthenticated
  );

  // Determine which user info to use
  const user = authUser || googleUser;
  const username = user?.username || user?.name; // Google login might use 'name' instead of 'username'

  // Add useEffect to check authentication status
  useEffect(() => {
    if (!isAuthenticated) {
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

  // const handleLogout = () => {
  //   setIsLoggingOut(true);
  //   dispatch(logout());
  //   dispatch(googleLogout());

  //   setTimeout(() => {
  //     navigate('/formToggle', { replace: true });
  //   }, 1000);
  // };

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
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Display username when logged in */}
      {isAuthenticated && username && (
        <div className="bg-blue-100 p-3 rounded-lg">
          <p className="text-blue-800 font-medium">
            Logged in as: <span className="font-bold">{username}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Receiver ID"
          min="1"
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Type a message..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded cursor-pointer transition-colors">
            <span>{image ? 'Change Image' : 'Upload Image'}</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg, image/png, image/gif"
              className="hidden"
            />
          </label>
          {image && (
            <button
              onClick={handleRemoveImage}
              className="bg-red-200 hover:bg-red-300 text-red-800 px-4 py-2 rounded transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {image && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Selected: {image.name}</p>
            <div className="mt-1 w-32 h-32 border rounded overflow-hidden">
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto cursor-pointer transition-colors disabled:opacity-50"
          disabled={!isAuthenticated || isUploading}
        >
          {isUploading ? 'Sending...' : 'Send'}
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full sm:w-auto transition-colors disabled:opacity-50"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;