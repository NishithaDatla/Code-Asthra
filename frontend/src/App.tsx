import React from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { LanguageProvider } from './i18n/LanguageContext';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppRoutes />
    </LanguageProvider>
  );
};

export default App;
