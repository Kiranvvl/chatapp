import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../redux/googleWithLoginSlice';
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector(
    (state) => state.googleWithLogin
  );

  useEffect(() => {
    if (token && !loading) {
      navigate('/chatWindow');
    }
  }, [token, loading, navigate]);

  const handleSuccess = ({ credential }) => {
    if (credential) dispatch(googleLogin(credential));
  };

  return (
    <div className=" flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xs sm:maxs-w-sm md:max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Login with Google</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
            <p className="text-gray-600">Logging in...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.error('Google Login Failed')}
              size="medium" // or "large" for mobile
              width="300" // adjust based on container
              useOneTap // for better mobile experience
            />
          </div>
        )}
        {error && (
          <p className="text-red-500 mt-2 text-sm sm:text-base">{error}</p>
        )}
      </div>
    </div>
  );
};

export default GoogleLoginButton;
