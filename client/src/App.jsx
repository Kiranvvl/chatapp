import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/NavBar';
import NotFound from './components/NotFound';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormToggle from './pages/FormToggle';
import ChatWindow from './pages/ChatWindow.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import VerifyEmail from './components/VerifyEmail.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleClientId } from './config/apiConfig.js';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GoogleClientId}>
      <Router>
        <Navbar />
        <Routes>
          <Route index element={<FormToggle />} />
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
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
