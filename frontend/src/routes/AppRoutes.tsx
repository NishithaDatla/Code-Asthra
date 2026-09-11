import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { FarmerDashboardPage } from '../pages/FarmerDashboardPage';
import { FarmerProfilePage } from '../pages/FarmerProfilePage';
import { FarmerRequestNewPage } from '../pages/FarmerRequestNewPage';
import { FarmerRequestDetailPage } from '../pages/FarmerRequestDetailPage';
import { FarmerRequestsListPage } from '../pages/FarmerRequestsListPage';
import { FarmerCentresPage } from '../pages/FarmerCentresPage';
import { FarmerCentreDetailPage } from '../pages/FarmerCentreDetailPage';
import { FarmerCentreAvailabilityPage } from '../pages/FarmerCentreAvailabilityPage';
import { FarmerSchedulePage } from '../pages/FarmerSchedulePage';
import { FarmerBookingReviewPage } from '../pages/FarmerBookingReviewPage';
import { FarmerBookingDetailPage } from '../pages/FarmerBookingDetailPage';
import { FarmerQueuePage } from '../pages/FarmerQueuePage';
import { FarmerProcurementDetailPage } from '../pages/FarmerProcurementDetailPage';
import { FarmerPaymentDetailPage } from '../pages/FarmerPaymentDetailPage';
import { FarmerNotificationsPage } from '../pages/FarmerNotificationsPage';
import { StaffDashboardPage } from '../pages/StaffDashboardPage';
import { StaffBookingsPage } from '../pages/StaffBookingsPage';
import { StaffQueuePage } from '../pages/StaffQueuePage';
import { StaffProcurementPage } from '../pages/StaffProcurementPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminCentresPage } from '../pages/AdminCentresPage';
import { AdminCentreDetailPage } from '../pages/AdminCentreDetailPage';
import { AdminAnalyticsPage } from '../pages/AdminAnalyticsPage';
import { AdminCongestionPage } from '../pages/AdminCongestionPage';
import { DesignSystemDemoPage } from '../pages/DesignSystemDemoPage';
import { FarmerLayout, StaffLayout, AdminLayout } from '../layouts/FarmerLayout';
import { ProtectedRoute, PublicOnlyRoute } from '../components/common/ProtectedRoute';
import type { UserRole } from '../types';

export const AppRoutes: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('FARMER');

  const renderLayout = (content: React.ReactNode) => {
    if (currentRole === 'CENTRE_STAFF') {
      return (
        <StaffLayout activeRole={currentRole} onRoleChange={setCurrentRole}>
          {content}
        </StaffLayout>
      );
    }
    if (currentRole === 'CENTRE_ADMIN' || currentRole === 'SYSTEM_ADMIN') {
      return (
        <AdminLayout activeRole={currentRole} onRoleChange={setCurrentRole}>
          {content}
        </AdminLayout>
      );
    }
    return (
      <FarmerLayout activeRole={currentRole} onRoleChange={setCurrentRole}>
        {content}
      </FarmerLayout>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/auth/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* Phase 8C & 8D Farmer Routes (Protected) */}
        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/profile"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8D Procurement Requests Routes */}
        <Route
          path="/farmer/request"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerRequestsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/request/new"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerRequestNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/request/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerRequestDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8D Centre Discovery Routes */}
        <Route
          path="/farmer/centres"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerCentresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/centres/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerCentreDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/centres/:id/availability"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerCentreAvailabilityPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8E Smart Scheduling & Booking Routes */}
        <Route
          path="/farmer/schedule/:requestId"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/booking/review"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerBookingReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/booking/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerBookingDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8F Live Queue Routes */}
        <Route
          path="/farmer/queue/:bookingId"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerQueuePage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8G Procurement & Payment Status Routes */}
        <Route
          path="/farmer/procurement/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerProcurementDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/payment/:id"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerPaymentDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8H Notifications Route */}
        <Route
          path="/farmer/notifications"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerNotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Sub-route shortcuts */}
        <Route
          path="/farmer/procurement"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerCentresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/payments"
          element={
            <ProtectedRoute allowedRoles={['FARMER']}>
              <FarmerPaymentDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8I Staff Routes (Protected) */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'CENTRE_STAFF']}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/bookings"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'CENTRE_STAFF']}>
              <StaffBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queue"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'CENTRE_STAFF']}>
              <StaffQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/procurement/:id"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'CENTRE_STAFF']}>
              <StaffProcurementPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 8J System Admin Routes (Protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'CENTRE_ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/centres"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'CENTRE_ADMIN']}>
              <AdminCentresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/centres/:id"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'CENTRE_ADMIN']}>
              <AdminCentreDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'CENTRE_ADMIN']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/congestion"
          element={
            <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'CENTRE_ADMIN']}>
              <AdminCongestionPage />
            </ProtectedRoute>
          }
        />

        {/* Development Route for Design System Showcase */}
        <Route
          path="/design-system"
          element={renderLayout(
            <DesignSystemDemoPage currentRole={currentRole} onRoleChange={setCurrentRole} />
          )}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
