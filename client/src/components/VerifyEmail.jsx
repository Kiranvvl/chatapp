import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../redux/authSlice';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid verification link.');
      navigate('/formToggle');
      return;
    }

    const verify = async () => {
      try {
        const result = await dispatch(verifyEmail(token)).unwrap();
        if (result.success) {
          toast.success('Email verified successfully! You can now log in.');
          navigate('/chatWindow');
        }
      } catch (err) {
        toast.error(err.message || 'Failed to verify email. Please try again.');
        navigate('/formToggle');
      }
    };

    verify();
  }, [dispatch, token, navigate]);

  if (!token) {
    return null; // or a loading spinner/message
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        {isLoading ? (
          <p>Verifying your email...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <p>Email verification in progress...</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
