// Configuration file for PTAK EXPO Frontend
// Automatically detects environment and sets appropriate API URLs

interface AppConfig {
  API_BASE_URL: string;
  NODE_ENV: string;
  DEBUG: boolean;
  ENABLE_LOGGING: boolean;
}

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = !!(process.env.REACT_APP_RAILWAY_ENVIRONMENT || 
                     window.location.hostname.includes('railway.app') || 
                     window.location.hostname.includes('up.railway.app'));

// Default configuration
const defaultConfig: AppConfig = {
  API_BASE_URL: 'http://localhost:3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: !isProduction,
  ENABLE_LOGGING: !isProduction
};

// Production/Railway configuration
const productionConfig: AppConfig = {
  ...defaultConfig,
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://backend-production-097b.up.railway.app',
  DEBUG: false,
  ENABLE_LOGGING: false
};

// Select config based on environment
const config: AppConfig = isProduction || isRailway ? productionConfig : defaultConfig;

// Override with environment variables if provided
if (process.env.REACT_APP_API_URL) {
  config.API_BASE_URL = process.env.REACT_APP_API_URL;
}

// Debug logging
if (config.DEBUG) {
  console.log('🔧 Config loaded:', {
    NODE_ENV: config.NODE_ENV,
    API_BASE_URL: config.API_BASE_URL,
    DEBUG: config.DEBUG,
    isProduction,
    isRailway,
    hostname: window.location.hostname
  });
}

export default config; 