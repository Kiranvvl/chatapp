import { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/Register';
import LoginForm from '../components/Login';

const FormToggle = () => {
  const [isRegistering, setIsRegistering] = useState(true);

  const handleToggleForm = () => {
    setIsRegistering((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* <h2 className="text-2xl font-bold mb-6 text-center" aria-live="polite">
          {isRegistering ? 'Register' : 'Login'}
        </h2> */}
        {isRegistering ? <RegisterForm /> : <LoginForm />}

        <p className="mt-4 text-center text-gray-600">
          {isRegistering
            ? 'Already have an account?'
            : "Don't have an account?"}
          <button
            type="button"
            onClick={handleToggleForm}
            className="text-blue-600 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>

        <p className="text-sm text-center mt-2">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default FormToggle;
