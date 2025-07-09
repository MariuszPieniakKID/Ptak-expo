// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Redirect to login if no token
        window.location.href = '/';
        return;
    }

    // Verify token with server
    verifyToken(token);

    // Initialize dashboard
    initializeDashboard();
});

// Verify token function
async function verifyToken(token) {
    try {
        const response = await fetch('/api/v1/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Token is invalid, redirect to login
            localStorage.removeItem('authToken');
            window.location.href = '/';
            return;
        }

        const data = await response.json();
        console.log('User verified:', data);
        
        // Update user information if available
        if (data.user) {
            updateUserInfo(data.user);
        }

    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/';
    }
}

// Update user information on the page
function updateUserInfo(user) {
    const userGreeting = document.querySelector('.dzieDobryJoanna');
    if (userGreeting) {
        if (user.firstName && user.lastName) {
            userGreeting.textContent = `Dzień dobry, ${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
            userGreeting.textContent = `Dzień dobry, ${user.firstName}`;
        } else {
            userGreeting.textContent = 'Dzień dobry!';
        }
    }
    
    console.log('User info updated:', user);
}

// Initialize dashboard functionality
function initializeDashboard() {
    // Try to load user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            updateUserInfo(user);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
        }
    }

    // Add click handlers for dashboard cards
    addCardHandlers();
    
    // Initialize any animations or interactions
    initializeInteractions();
    
    console.log('Dashboard initialized');
}

// Menu handlers moved to menu.js module

// Add dashboard card click handlers
function addCardHandlers() {
    // Wystawcy card
    const wystawcyCard = document.querySelector('.wystawcyParent');
    if (wystawcyCard) {
        wystawcyCard.addEventListener('click', function() {
            showNotification('Moduł Wystawcy - funkcja w przygotowaniu');
        });
        wystawcyCard.style.cursor = 'pointer';
    }

    // Wydarzenia card
    const wydarzeniaCard = document.querySelector('.wydarzeniaParent');
    if (wydarzeniaCard) {
        wydarzeniaCard.addEventListener('click', function() {
            showNotification('Moduł Wydarzenia - funkcja w przygotowaniu');
        });
        wydarzeniaCard.style.cursor = 'pointer';
    }

    // Użytkownicy card
    const uytkownicyCard = document.querySelector('.uytkownicyParent');
    if (uytkownicyCard) {
        uytkownicyCard.addEventListener('click', function() {
            showNotification('Moduł Użytkownicy - funkcja w przygotowaniu');
        });
        uytkownicyCard.style.cursor = 'pointer';
    }

    // Baza danych card
    const bazaDanychCard = document.querySelector('.bazaDanychParent');
    if (bazaDanychCard) {
        bazaDanychCard.addEventListener('click', function() {
            showNotification('Moduł Baza Danych - funkcja w przygotowaniu');
        });
        bazaDanychCard.style.cursor = 'pointer';
    }
}

// Initialize interactions and animations
function initializeInteractions() {
    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll(
        '.wystawcyParent, .wydarzeniaParent, .uytkownicyParent, .bazaDanychParent, ' +
        '.home, .bazaWystawcw, .bazaWydarze, .uytkownicy, .bazaDanych'
    );

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'all 0.2s ease';
        });

        element.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
    });
}

// Logout function
function logout() {
    // Remove token and user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Show logout message
    showNotification('Wylogowano pomyślnie');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// Show notification function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        font-family: var(--font-open-sans);
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    // Add to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Hide and remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        logout();
    }
    
    // ESC to show help
    if (e.key === 'Escape') {
        showNotification('Skróty klawiszowe: Ctrl+L - Wyloguj');
    }
});

// Add some debug information
console.log('Dashboard JavaScript loaded');
console.log('User token present:', !!localStorage.getItem('authToken')); 