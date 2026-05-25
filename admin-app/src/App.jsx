import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Services from './pages/Services';
import Orders from './pages/Orders';
import Bookings from './pages/Bookings';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Team from './pages/Team';
import TeamVisuals from './pages/TeamVisuals';
import ManageStaff from './pages/ManageStaff';
import CreateCustomer from './pages/CreateCustomer';
import ViewCustomer from './pages/ViewCustomer';
import CreateService from './pages/CreateService';
import CreateOrder from './pages/CreateOrder';
import CreateBooking from './pages/CreateBooking';
import CreateInvoice from './pages/CreateInvoice';
import Categories from './pages/Categories';
import HeroSlider from './pages/HeroSlider';
import Reviews from './pages/Reviews';
import FAQs from './pages/FAQs';
import CMS from './pages/CMS';
import Inquiries from './pages/Inquiries';
import Subscribers from './pages/Subscribers';
import News from './pages/News';
import CreateNews from './pages/CreateNews';
import MarketingPopups from './pages/MarketingPopups';
import NavigationManager from './pages/NavigationManager';
import PriceManager from './pages/PriceManager';
import RoomManager from './pages/RoomManager';
import Backup from './pages/Backup';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/visuals" element={<TeamVisuals />} />
            <Route path="/team/create" element={<ManageStaff />} />
            <Route path="/team/edit/:id" element={<ManageStaff />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/create" element={<CreateService />} />
            <Route path="/services/edit/:id" element={<CreateService />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/hero-slider" element={<HeroSlider />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/create" element={<CreateBooking />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/create" element={<CreateOrder />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/create" element={<CreateCustomer />} />
            <Route path="/customers/:id" element={<ViewCustomer />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/cms" element={<CMS />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/subscribers" element={<Subscribers />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/create" element={<CreateNews />} />
            <Route path="/news/edit/:id" element={<CreateNews />} />
            <Route path="/marketing-popups" element={<MarketingPopups />} />
            <Route path="/navigation" element={<NavigationManager />} />
            <Route path="/pricing" element={<PriceManager />} />
            <Route path="/room-manager" element={<RoomManager />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/settings" element={<Settings />} />


            <Route path="/users" element={<Navigate to="/team" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
