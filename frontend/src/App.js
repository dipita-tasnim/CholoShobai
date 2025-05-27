import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import MessageSystem from './components/MessageSystem';

// Pages & Components
import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import RideForm from './components/RideForm';
import MyRides from './pages/MyRides';
import LoginForm from './components/LoginForm';
import RegForm from './components/RegForm';
import LandingPage from './pages/LandingPage';
import MyProfile from './pages/MyProfile';
import UserProfile from './pages/UserProfile';
import UserSearch from './components/UserSearch';
import AdminDashboard from './pages/AdminDashboard';
import Logout from './components/Logout';
import RideConfirmation from './pages/RideConfirmation';
import Messages from './pages/Messages';
import './index.css';

function AppLayout() {
  const location = useLocation();
  const hideSidebarRoutes = ["/welcome", "/login", "/registration"];
  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="main-container">
      {!shouldHideSidebar && <Sidebar />}
      <div className={`content-area ${!shouldHideSidebar ? 'with-sidebar' : ''}`}>
        <div className="pages">
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" />} />
            <Route path="/welcome" element={<LandingPage />} />
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/home" /> : <LoginForm />}
            />
            <Route
              path="/registration"
              element={isLoggedIn ? <Navigate to="/home" /> : <RegForm />}
            />
            <Route path="/home" element={<Home />} />
            <Route path="/create" element={<RideForm />} />
            <Route path="/myrides" element={<MyRides />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/search-users" element={<UserSearch />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/ride-confirmation" element={<RideConfirmation />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="*" element={<div>404 Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
