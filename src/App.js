import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import IntroPage from './components/Pages/IntroPage';
import HomePage from './components/Pages/HomePage';
import LoginPage from './components/Pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import UserRegistrationPage from './components/Pages/UserRegistrationPage';
import UserProfile from './components/Pages/UserProfile';
import ChildRegistration from './components/Pages/ChildRegistration';
import ContactRegistration from './components/Pages/ContactRegistration';
import Layout from './components/Layout';
import Calendar from './components/Shared/Calendar';
import ScheduleChildSitterPage from './components/Pages/ScheduleChildSitterPage';
import AdminDashboard from './components/Pages/AdminDashboard';
import MeetPage from './components/Pages/MeetPage';
import EventPage from './components/Pages/EventPage';
import TotivitiesPage from './components/Pages/TotivitiesPage';
import DealsPage from './components/Pages/DealsPage';
import SharePage from './components/Pages/SharePage';
import CareersPage from './components/Pages/GrowPage';
import TotsTidbits from './components/Pages/TotsTidbits';
import ManageReservationsPage from './components/Dashboard/ManageReservationsPage';
import PartyPage from './components/Pages/Party';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={ <IntroPage /> } />
          <Route path="/home" element={ <PrivateRoute element={ <HomePage /> }/> } />
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/calendar" element={ <PrivateRoute element={ <Calendar /> } />} />
          <Route path="/addContact" element={ <PrivateRoute element={ <ContactRegistration /> } />} />
          <Route path="/addChild/:childId?" element={ <PrivateRoute element={ <ChildRegistration /> } />} />
          <Route path="/admin" element={ <PrivateRoute element={ <AdminDashboard /> } />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;