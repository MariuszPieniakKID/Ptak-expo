import React, { useState, useEffect } from 'react';
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
  ImageBackground,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
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

    // Walidacja email
    if (!email) {
      setEmailError('Podaj adres e-mail');
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Podaj poprawny adres e-mail np.: email@gmail.pl');
      valid = false;
    } else {
      setEmailError('');
    }

    // Walidacja hasła
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
      
      if (result.success) {
        // Navigation handled by AuthProvider state change
      } else {
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
           error === '' && 
           !loading;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground 
        source={require('../assets/image-35@2x.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.gradientOverlay} />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/group-257@3x.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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
                placeholder={isFocusedEmail ? "" : "adres@gmail.com"}
                placeholderTextColor="#2e2e38"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setIsFocusedEmail(true)}
                onBlur={() => setIsFocusedEmail(false)}
                editable={!loading}
              />
              {!emailError && (
                <Text style={styles.inputDescription}>Adres E-mail</Text>
              )}
              {emailError && (
                <Text style={styles.errorInputMessage}>{emailError}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.inputData,
                  passwordError ? styles.inputError : null
                ]}
                value={password}
                onChangeText={handlePasswordChange}
                placeholder={isFocusedPassword ? "" : "*******"}
                placeholderTextColor="#2e2e38"
                secureTextEntry
                autoComplete="password"
                onFocus={() => setIsFocusedPassword(true)}
                onBlur={() => setIsFocusedPassword(false)}
                editable={!loading}
              />
              {!passwordError && (
                <Text style={styles.inputDescription}>Hasło</Text>
              )}
              {passwordError && (
                <Text style={styles.errorInputMessage}>{passwordError}</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {error && (
                <Text style={styles.errorMessage}>{error}</Text>
              )}
              
              {loading ? (
                <View style={styles.spinner}>
                  <ActivityIndicator size="large" color="#7788ef" />
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
                <Text style={styles.remindPasswordText}>Przypomnij hasło</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 238, 240, 0.8)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(111, 135, 246, 0.1)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  logo: {
    width: 71,
    height: 67,
  },
  loginDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e2e38',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  loginTitle: {
    fontSize: 18,
    color: '#2e2e38',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputData: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d7d9dd',
    borderRadius: 5,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2e2e38',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#c7353c',
  },
  inputDescription: {
    fontSize: 11,
    color: '#a7a7a7',
    marginTop: 4,
    marginLeft: 4,
  },
  errorInputMessage: {
    fontSize: 11,
    color: '#c7353c',
    marginTop: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  errorMessage: {
    color: '#c7353c',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
  },
  spinner: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logButton: {
    height: 50,
    backgroundColor: '#7788ef',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logButtonDisabled: {
    backgroundColor: '#d7d9dd',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  remindPassword: {
    alignItems: 'center',
  },
  remindPasswordText: {
    color: '#7788ef',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen; 