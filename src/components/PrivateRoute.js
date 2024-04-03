import { Navigate } from 'react-router-dom';

const isAuthenticated = () => {
  // Check if user is authenticated here
  return true;
};

const PrivateRoute = ({ element }) => (
  isAuthenticated() ? element : <Navigate to="/login" replace />
);

export default PrivateRoute;