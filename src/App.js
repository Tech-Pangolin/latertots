import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './components/Pages/HomePage';
import LoginPage from './components/Pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import UserRegistrationPage from './components/Pages/UserRegistrationPage';
import UserProfile from './components/Pages/UserProfile';
import ChildRegistration from './components/Pages/ChildRegistration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={ <PrivateRoute element={ <HomePage /> }/> } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<PrivateRoute element={ <UserRegistrationPage /> }/>} />
        <Route path="/profile" element={<PrivateRoute element={ <UserProfile /> } />} />
        <Route path="/addChild" element={ <PrivateRoute element={ <ChildRegistration /> } />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;