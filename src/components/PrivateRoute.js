import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const PrivateRoute = ({ element }) => {
  const { currentUser } = useAuth();
  console.log("Current auth state: ", currentUser)

  return currentUser ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;