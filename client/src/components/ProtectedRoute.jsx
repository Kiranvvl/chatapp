// import { useSelector } from 'react-redux';
// import { Navigate, Outlet } from 'react-router-dom';

// const ProtectedRoute = () => {
//   const { isAuthenticated: googleAuth, user: googleUser } = useSelector(
//     (state) => state.googleWithLogin
//   );
//   const { isAuthenticated: regularAuth, user: regularUser } = useSelector(
//     (state) => state.auth
//   );

//   const isAuthenticated = googleAuth || regularAuth;
//   const user = googleUser || regularUser;

//   if (!isAuthenticated || !user) {
//     return <Navigate to="/formToggle" replace />;
//   }

//   return <Outlet />;
// };

// export default ProtectedRoute;

import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();

  const { isAuthenticated: googleAuth, user: googleUser } = useSelector(
    (state) => state.googleWithLogin
  );
  const {
    isAuthenticated: regularAuth,
    user: regularUser,
    isLoading,
  } = useSelector((state) => state.auth);

  const isAuthenticated = googleAuth || regularAuth;
  const user = googleUser || regularUser;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/formToggle" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
