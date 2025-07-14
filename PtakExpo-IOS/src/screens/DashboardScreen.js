import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const DashboardScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
       'Czy na pewno chcesz się wylogować?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Wyloguj',
          onPress: logout,
          style: 'destructive',
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Dokumenty',
      description: 'Zarządzaj dokumentami targowymi',
      icon: '📄',
      color: '#e3f2fd',
    },
    {
      title: 'Materiały marketingowe',
      description: 'Biblioteka zasobów promocyjnych',
      icon: '📢',
      color: '#e8f5e8',
    },
    {
      title: 'Komunikaty',
      description: 'Wiadomości i powiadomienia',
      icon: '🔔',
      color: '#fff3e0',
    },
    {
      title: 'Generator zaproszeń',
      description: 'Zarządzaj zaproszeniami dla gości',
      icon: '👥',
      color: '#f3e5f5',
    },
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
      
      {/* Header */}
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
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>
            Witaj w aplikacji PTAK EXPO
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Portal dla wystawców targowych
          </Text>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userRole}>
                {user.role === 'admin' ? '👑 Administrator' : '🏢 Wystawca'}
              </Text>
              {user.firstName && user.lastName && (
                <Text style={styles.userName}>
                  {user.firstName} {user.lastName}
                </Text>
              )}
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.companyName && (
                <Text style={styles.userCompany}>{user.companyName}</Text>
              )}
            </View>
          )}
        </View>

        {/* Menu Grid */}
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
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>{item.icon}</Text>
                </View>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesContainer}>
          <Text style={styles.activitiesTitle}>Ostatnie aktywności</Text>
          <View style={styles.activitiesContent}>
            <Text style={styles.activitiesEmpty}>
              Brak ostatnich aktywności do wyświetlenia.
            </Text>
          </View>
        </View>

        {/* Admin Panel */}
        {user?.role === 'admin' && (
          <View style={styles.adminContainer}>
            <Text style={styles.adminTitle}>Panel Administracyjny</Text>
            <Text style={styles.adminDescription}>
              Jako administrator masz dostęp do funkcji zarządzania systemem.
            </Text>
            <TouchableOpacity style={styles.adminButton}>
              <Text style={styles.adminButtonText}>
                Przejdź do panelu administratora
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    width: '100%',
  },
  userRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuContainer: {
    margin: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  activitiesContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  activitiesContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  activitiesEmpty: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  adminContainer: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  adminDescription: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 16,
    lineHeight: 20,
  },
  adminButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen; 