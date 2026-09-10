import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Drawer } from '../components/ui/Drawer';
import type { UserRole } from '../types';

export interface LayoutProps {
  children: React.ReactNode;
  activeRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export const FarmerLayout: React.FC<LayoutProps> = ({ children, activeRole = 'FARMER', onRoleChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <Navbar
        role={activeRole}
        userName="Ramesh Patel"
        userPhone="+91 98765 43210"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onSwitchRole={onRoleChange}
      />

      <div className="flex-1 flex max-w-screen-2xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar role={activeRole} activePath="/dashboard" />
        </div>

        {/* Mobile Navigation Drawer */}
        <Drawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} position="left" title="Menu">
          <Sidebar role={activeRole} activePath="/dashboard" className="w-full border-r-0" />
        </Drawer>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export const StaffLayout: React.FC<LayoutProps> = ({ children, activeRole = 'CENTRE_STAFF', onRoleChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar
        role={activeRole}
        userName="Suresh Kumar (Desk Officer)"
        userPhone="+91 98111 22233"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onSwitchRole={onRoleChange}
      />

      <div className="flex-1 flex max-w-screen-2xl w-full mx-auto">
        <div className="hidden lg:block shrink-0">
          <Sidebar role={activeRole} activePath="/staff/desk" />
        </div>

        <Drawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} position="left" title="Staff Desk Menu">
          <Sidebar role={activeRole} activePath="/staff/desk" className="w-full border-r-0" />
        </Drawer>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export const AdminLayout: React.FC<LayoutProps> = ({ children, activeRole = 'CENTRE_ADMIN', onRoleChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        role={activeRole}
        userName="Anil Sharma (District Admin)"
        userPhone="+91 99999 88888"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onSwitchRole={onRoleChange}
      />

      <div className="flex-1 flex max-w-screen-2xl w-full mx-auto text-slate-900">
        <div className="hidden lg:block shrink-0">
          <Sidebar role={activeRole} activePath="/admin/overview" />
        </div>

        <Drawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} position="left" title="Admin Menu">
          <Sidebar role={activeRole} activePath="/admin/overview" className="w-full border-r-0" />
        </Drawer>

        <div className="flex-1 min-w-0 bg-slate-50">{children}</div>
      </div>
    </div>
  );
};
