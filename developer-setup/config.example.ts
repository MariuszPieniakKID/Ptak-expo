// PTAK EXPO - Frontend Configuration
// Skopiuj ten plik do ptak-expo-frontend/src/config/config.ts

const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // App Configuration
  APP_NAME: 'PTAK EXPO Admin Panel',
  APP_VERSION: '1.0.0',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Features
  FEATURES: {
    MOBILE_SUPPORT: true,
    DARK_MODE: false,
    NOTIFICATIONS: true,
  },
  
  // UI Configuration
  UI: {
    SIDEBAR_WIDTH: 280,
    HEADER_HEIGHT: 64,
    ITEMS_PER_PAGE: 20,
  },
  
  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
};

export default config;
