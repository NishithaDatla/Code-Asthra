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
import { StaffDashboardPlaceholder } from '../pages/StaffDashboardPlaceholder';
import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
import { DesignSystemDemoPage } from '../pages/DesignSystemDemoPage';
import { FarmerLayout, StaffLayout, AdminLayout } from '../layouts/FarmerLayout';
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
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />

        {/* Phase 8C & 8D Farmer Routes */}
        <Route path="/farmer/dashboard" element={<FarmerDashboardPage />} />
        <Route path="/farmer/profile" element={<FarmerProfilePage />} />

        {/* Phase 8D Procurement Requests Routes */}
        <Route path="/farmer/request" element={<FarmerRequestsListPage />} />
        <Route path="/farmer/request/new" element={<FarmerRequestNewPage />} />
        <Route path="/farmer/request/:id" element={<FarmerRequestDetailPage />} />

        {/* Phase 8D Centre Discovery Routes */}
        <Route path="/farmer/centres" element={<FarmerCentresPage />} />
        <Route path="/farmer/centres/:id" element={<FarmerCentreDetailPage />} />
        <Route path="/farmer/centres/:id/availability" element={<FarmerCentreAvailabilityPage />} />

        {/* Phase 8E Smart Scheduling & Booking Routes */}
        <Route path="/farmer/schedule/:requestId" element={<FarmerSchedulePage />} />
        <Route path="/farmer/booking/review" element={<FarmerBookingReviewPage />} />
        <Route path="/farmer/booking/:id" element={<FarmerBookingDetailPage />} />

        {/* Phase 8F Live Queue Routes */}
        <Route path="/farmer/queue/:bookingId" element={<FarmerQueuePage />} />

        {/* Phase 8G Procurement & Payment Status Routes */}
        <Route path="/farmer/procurement/:id" element={<FarmerProcurementDetailPage />} />
        <Route path="/farmer/payment/:id" element={<FarmerPaymentDetailPage />} />

        {/* Sub-route shortcuts */}
        <Route path="/farmer/procurement" element={<FarmerCentresPage />} />
        <Route path="/farmer/payments" element={<FarmerPaymentDetailPage />} />

        {/* Staff & Admin Placeholder Dashboard Routes */}
        <Route path="/staff/dashboard" element={<StaffDashboardPlaceholder />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPlaceholder />} />

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
