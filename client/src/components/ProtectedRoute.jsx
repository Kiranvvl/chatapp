import { useSelector } from 'react-redux';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../utils/auth'; // Assuming this is your utility function

const ProtectedRoute = () => {
  const location = useLocation();

  const {
    isAuthenticated: googleAuth,
    user: googleUser,
    isLoading: googleLoading,
  } = useSelector((state) => state.googleWithLogin);

  const {
    isAuthenticated: regularAuth,
    user: regularUser,
    isLoading: regularLoading,
    error: authError,
  } = useSelector((state) => state.auth);

  // Check for token in storage as fallback
  const storedToken = getAuthToken();
  const storedUser = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;

  const isLoading = googleLoading || regularLoading;
  const isAuthenticated =
    googleAuth || regularAuth || (storedToken && storedUser);
  const user = googleUser || regularUser || storedUser;

  // If still loading, show loading indicator
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If there was an auth error (optional handling)
  if (authError) {
    console.error('Authentication error:', authError);
    // You might want to clear invalid auth state here
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // If not authenticated or no user, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/formToggle" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;

// import { useSelector } from 'react-redux';
// import { Navigate, Outlet, useLocation } from 'react-router-dom';

// const ProtectedRoute = () => {
//   const location = useLocation();

//   const { isAuthenticated: googleAuth, user: googleUser } = useSelector(
//     (state) => state.googleWithLogin
//   );
//   const {
//     isAuthenticated: regularAuth,
//     user: regularUser,
//     isLoading,
//   } = useSelector((state) => state.auth);

//   const isAuthenticated = googleAuth || regularAuth;
//   const user = googleUser || regularUser;

//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated || !user) {
//     return <Navigate to="/formToggle" state={{ from: location }} replace />;
//   }

//   return <Outlet />;
// };

// export default ProtectedRoute;
