// EXPO SNACK - PTAK EXPO MOBILE
// Skopiuj ten kod do App.js w Expo Snack

import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// CONFIGURATION
const BASE_URL = 'https://backend-production-df8c.up.railway.app/api/v1';
const { width, height } = Dimensions.get('window');

// API SERVICE
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch (storageError) {
        console.error('Error removing data:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

// AUTH API
const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
  test: () => api.get('/auth/test'),
};

// AUTH CONTEXT
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          await verifyToken();
        } catch (error) {
          console.error('Error parsing user data:', error);
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    try {
      await authAPI.verify();
    } catch (error) {
      console.error('Token verification failed:', error);
      await logout();
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Błąd podczas logowania'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch (error) {
        console.error('Error removing data:', error);
      }
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// LOGIN SCREEN
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Dashboard');
    }
  }, [isAuthenticated, navigation]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setError('');
    if (!validateEmail(value)) {
      setEmailError('Podaj poprawny adres e-mail');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setError('');
    setPasswordError('');
  };

  const handleSubmit = async () => {
    setError('');
    let valid = true;

    if (!email) {
      setEmailError('Podaj adres e-mail');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Podaj poprawny adres e-mail');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Podaj hasło');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setError('Nieprawidłowy email lub hasło. Spróbuj ponownie.');
      }
    } catch (err) {
      setError('Błąd logowania. Sprawdź dane i spróbuj ponownie.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return email !== '' && 
           password !== '' && 
           emailError === '' && 
           passwordError === '' && 
           !loading;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.backgroundContainer}>
        <View style={styles.overlay} />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PTAK EXPO</Text>
          </View>

          <View style={styles.loginDataContainer}>
            <Text style={styles.title}>Panel{'\n'}Administratora</Text>
            <Text style={styles.loginTitle}>Logowanie</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.inputData,
                  emailError ? styles.inputError : null
                ]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="test@test.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
              <Text style={styles.inputDescription}>
                {emailError || 'Adres E-mail'}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.inputData,
                  passwordError ? styles.inputError : null
                ]}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="test123"
                placeholderTextColor="#666"
                secureTextEntry
                autoComplete="password"
                editable={!loading}
              />
              <Text style={styles.inputDescription}>
                {passwordError || 'Hasło'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {error && (
                <Text style={styles.errorMessage}>{error}</Text>
              )}
              
              {loading ? (
                <View style={styles.spinner}>
                  <ActivityIndicator size="large" color="#1976d2" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.logButton,
                    !isFormValid() && styles.logButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!isFormValid()}
                >
                  <Text style={styles.logButtonText}>Zaloguj się</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.remindPassword}>
                <Text style={styles.remindPasswordText}>Dane testowe: test@test.com / test123</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// DASHBOARD SCREEN
const DashboardScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Wyloguj', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const menuItems = [
    { title: 'Dokumenty', description: 'Zarządzaj dokumentami', icon: '📄', color: '#e3f2fd' },
    { title: 'Materiały', description: 'Zasoby promocyjne', icon: '📢', color: '#e8f5e8' },
    { title: 'Komunikaty', description: 'Powiadomienia', icon: '🔔', color: '#fff3e0' },
    { title: 'Zaproszenia', description: 'Generator zaproszeń', icon: '👥', color: '#f3e5f5' },
  ];

  const handleMenuPress = (item) => {
    Alert.alert(
      item.title,
      'Ta funkcjonalność będzie dostępna w pełnej wersji aplikacji.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>PTAK EXPO</Text>
            <Text style={styles.headerSubtitle}>Portal Wystawców</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Wyloguj</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Witaj w aplikacji PTAK EXPO</Text>
          <Text style={styles.welcomeSubtitle}>Portal dla wystawców targowych</Text>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userRole}>
                {user.role === 'admin' ? '👑 Administrator' : '🏢 Wystawca'}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Funkcje główne</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: item.color }]}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.activitiesContainer}>
          <Text style={styles.activitiesTitle}>Status połączenia</Text>
          <View style={styles.activitiesContent}>
            <Text style={styles.activitiesEmpty}>
              ✅ Połączono z Railway Backend
            </Text>
            <Text style={styles.activitiesEmpty}>
              🌐 {BASE_URL}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// NAVIGATION
const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#1976d2" />
    <Text style={styles.loadingText}>Ładowanie...</Text>
  </View>
);

const AppNavigation = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// MAIN APP
export default function App() {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundContainer: { flex: 1, backgroundColor: '#f0f4f8' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(25, 118, 210, 0.1)' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40, marginTop: 60 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#1976d2' },
  loginDataContainer: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 8 },
  loginTitle: { fontSize: 18, textAlign: 'center', color: '#666', marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  inputData: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  inputError: { borderColor: '#f44336' },
  inputDescription: { fontSize: 12, color: '#666', marginTop: 4 },
  buttonContainer: { alignItems: 'center', marginTop: 8 },
  logButton: { backgroundColor: '#1976d2', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, width: '100%' },
  logButtonDisabled: { backgroundColor: '#ccc' },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  remindPassword: { marginTop: 16 },
  remindPasswordText: { color: '#1976d2', fontSize: 14 },
  errorMessage: { color: '#f44336', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  spinner: { marginVertical: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  header: { backgroundColor: '#1976d2', paddingBottom: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.8 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  content: { flex: 1 },
  welcomeContainer: { backgroundColor: '#fff', margin: 16, padding: 24, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  userInfo: { alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee', width: '100%' },
  userRole: { fontSize: 16, fontWeight: '600', color: '#1976d2', marginBottom: 8 },
  userEmail: { fontSize: 14, color: '#666' },
  menuContainer: { margin: 16 },
  menuTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '48%', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  menuItemDescription: { fontSize: 12, color: '#666', textAlign: 'center' },
  activitiesContainer: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  activitiesTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  activitiesContent: { alignItems: 'center' },
  activitiesEmpty: { fontSize: 14, color: '#666', marginBottom: 4 },
}); 