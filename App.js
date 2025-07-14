import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
};

export default App; 