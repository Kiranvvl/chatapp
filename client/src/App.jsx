import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/NavBar';
import NotFound from './components/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormToggle from './pages/FormToggle';
import ChatWindow from './pages/ChatWindow.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyEmail from './components/VerifyEmail.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { initializeAuth } from './redux/authSlice';


const GoogleClientId = import.meta.env.VITE_GOOGLE_CLIENTID;
const AppRoutes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isAuthenticated: googleAuth, user: googleUser } = useSelector((state) => state.googleWithLogin);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const isLoggedIn = (isAuthenticated && user) || (googleAuth && googleUser);
    if (isLoggedIn && (location.pathname === '/' || location.pathname === '/formToggle')) {
      navigate('/chatWindow', { replace: true });
    }
  }, [isAuthenticated, user, googleAuth, googleUser, location.pathname, navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route index element={<Navigate to="/formToggle" replace />} />
        <Route path="/formToggle" element={<FormToggle />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/chatWindow" element={<ChatWindow />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GoogleClientId}>
      <Router>
        <AppRoutes />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
