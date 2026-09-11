import React from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './context/AuthContext';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
