import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp'; // Import New Page
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ItemDetail from './pages/ItemDetail';
import CreateItem from './pages/CreateItem';
import MyItems from './pages/MyItems';
import EditItem from './pages/EditItem';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminItems from './pages/AdminItems';
import AdminBids from './pages/AdminBids';
import Account from './pages/Account';
import AdminAccount from './pages/AdminAccount';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/market" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
          <Navbar />
          <main className="flex-1 pt-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOtp />} /> {/* New Route */}
              <Route path="/reset-password" element={<ResetPassword />} /> {/* Updated Route */}
              <Route path="/item/:id" element={<ItemDetail />} />
              
              {/* Protected Routes */}
              <Route 
                path="/market" 
                element={
                  <ProtectedRoute>
                    <Home /> {/* This acts as the Marketplace */}
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-account" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminAccount />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-item" 
                element={
                  <ProtectedRoute allowedRoles={['Seller']}>
                    <CreateItem />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-items" 
                element={
                  <ProtectedRoute allowedRoles={['Seller']}>
                    <MyItems />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/edit-item/:id" 
                element={
                  <ProtectedRoute allowedRoles={['Seller']}>
                    <EditItem />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/items" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminItems />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/bids" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminBids />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;