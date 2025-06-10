import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/googleWithLoginSlice';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector(
    (state) => state.googleWithLogin
  );

  useEffect(() => {
    if (token && !loading && !error) {
      navigate('/chatWindow');
    }
  }, [token, loading, error, navigate, dispatch]);

  const handleSuccess = async (credentialResponse) => {
    try {
      if (credentialResponse.credential) {
        const decoded = jwtDecode(credentialResponse.credential);
        console.log('Decoded Google JWT:', decoded);
        await dispatch(googleLogin(credentialResponse.credential)).unwrap();
      }
    } catch (err) {
      console.error('Error handling Google login:', err);
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div className="flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto text-center">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Login with Google
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Logging in...</p>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              size="medium"
              shape="pill"
              text="continue_with"
              theme="filled_blue"
              auto_select={false}
              useOneTap={false}
            />
          </div>
        )}
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default GoogleLoginButton;
