import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ALERT_TYPES, ERROR_MESSAGES } from '../Helpers/constants';

const AdminRoute = ({ element }) => {
  const { currentUser } = useAuth();

  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  if (currentUser.Role !== 'admin') {
    return (
      <Navigate 
        to="/profile" 
        replace 
        state={{ 
          alerts: [{ 
            type: ALERT_TYPES.WARNING, 
            message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS 
          }] 
        }} 
      />
    );
  }

  return element;
};

export default AdminRoute;
