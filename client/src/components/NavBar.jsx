// import { AnimatePresence, motion } from 'framer-motion';
// import { useState } from 'react';
// import { Link } from 'react-router-dom';

// const Navbar = () => {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

//   return (
//     <nav className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-lg fixed w-full top-0 z-50">
//       <div className="container mx-auto px-4 py-2 flex justify-between items-center">
//         <Link to="/" className="text-2xl font-bold hover:text-gray-200">
//           ChatApp
//         </Link>

//         <div className="hidden md:flex space-x-6">
//           <Link to="/formToggle" className="hover:text-gray-200">
//             Reg/Login
//           </Link>
//           <Link to="/Chatwindow" className="hover:text-gray-200">
//             ChatWindow
//           </Link>
//         </div>

//         <div className="md:hidden">
//           <button
//             className="focus:outline-none text-white"
//             onClick={toggleMobileMenu}
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M4 6h16M4 12h16m-7 6h7"
//               ></path>
//             </svg>
//           </button>
//         </div>
//       </div>

//       <AnimatePresence>
//         {' '}
//         {/* Wrap the mobile menu with AnimatePresence */}
//         {isMobileMenuOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.3 }}
//             className="md:hidden bg-blue-800" // Added background color
//           >
//             <Link
//               to="/formToggle"
//               className="block px-4 py-2 hover:bg-blue-700"
//               onClick={toggleMobileMenu}
//             >
//               Reg/Login
//             </Link>
//             <Link
//               to="/Chatwindow"
//               className="block px-4 py-2 hover:bg-blue-700"
//               onClick={toggleMobileMenu}
//             >
//               ChatWindow
//             </Link>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </nav>
//   );
// };

// export default Navbar;

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { googleLogout } from '../redux/googleWithLoginSlice';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get authentication state from both regular auth and Google auth
  const { isAuthenticated: regularAuth, user: regularUser } = useSelector(
    (state) => state.auth
  );
  const { isAuthenticated: googleAuth, user: googleUser } = useSelector(
    (state) => state.googleWithLogin
  );

  const isAuthenticated = regularAuth || googleAuth;
  const user = regularUser || googleUser;

  const handleLogout = () => {
    dispatch(logout());
    dispatch(googleLogout());
    navigate('/formToggle', { replace: true });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-200">
          ChatApp
        </Link>

        <div className="hidden md:flex space-x-6 items-center">
          {!isAuthenticated ? (
            <>
              <Link to="/formToggle" className="hover:text-gray-200">
                Login/Register
              </Link>
            </>
          ) : (
            <>
              <Link to="/chatWindow" className="hover:text-gray-200">
                Chat
              </Link>
              <button onClick={handleLogout} className="hover:text-gray-200">
                Logout
              </button>
              {user?.username && (
                <span className="text-sm ml-2">Hello, {user.username}</span>
              )}
            </>
          )}
        </div>

        <div className="md:hidden">
          <button
            className="focus:outline-none text-white"
            onClick={toggleMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-blue-800"
          >
            {!isAuthenticated ? (
              <>
                <Link
                  to="/formToggle"
                  className="block px-4 py-2 hover:bg-blue-700"
                  onClick={toggleMobileMenu}
                >
                  Login/Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/chatWindow"
                  className="block px-4 py-2 hover:bg-blue-700"
                  onClick={toggleMobileMenu}
                >
                  Chat
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-700"
                >
                  Logout
                </button>
                {user?.username && (
                  <div className="px-4 py-2 text-sm border-t border-blue-700">
                    Hello, {user.username}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
