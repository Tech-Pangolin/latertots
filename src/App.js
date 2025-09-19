import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import IntroPage from './components/Pages/IntroPage';
import LoginPage from './components/Pages/LoginPage';
import ForgotPasswordPage from './components/Pages/ForgotPasswordPage';
import ActionHandlerPage from './components/Pages/ActionHandlerPage';
import PrivateRoute from './components/PrivateRoute';
import UserRegistrationPage from './components/Pages/UserRegistrationPage';
import UserProfile from './components/Pages/UserProfile';
import Layout from './components/Layout';
import ScheduleChildSitterPage from './components/Pages/ScheduleChildSitterPage';
import AdminDashboard from './components/Pages/AdminDashboard';
import MeetPage from './components/Pages/MeetPage';
import EventPage from './components/Pages/EventPage';
import TotivitiesPage from './components/Pages/TotivitiesPage';
import DealsPage from './components/Pages/DealsPage';
import SharePage from './components/Pages/SharePage';
import CareersPage from './components/Pages/GrowPage';
import TotsTidbits from './components/Pages/TotsTidbits';
import PartyPage from './components/Pages/Party';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={ <IntroPage /> } />
          <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/action" element={<ActionHandlerPage />} />
          <Route path="/teamtots" element={<MeetPage />} />
          <Route path="/events" element={<EventPage />} />
          <Route path="/party" element={<PartyPage />} />
          <Route path="/totivities" element={<TotivitiesPage />} />
          <Route path="/testimonials" element={<SharePage />} />
          <Route path="/totstidbits" element={<TotsTidbits />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/deals" element={<DealsPage />} />

          <Route path="/register" element={ <UserRegistrationPage />} />
          <Route path="/profile" element={<PrivateRoute element={ <UserProfile /> } />} />
          <Route path="/schedule" element={ <PrivateRoute element={ <ScheduleChildSitterPage /> } />} />
          <Route path="/admin" element={ <PrivateRoute element={ <AdminDashboard /> } />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;