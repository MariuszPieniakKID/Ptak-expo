// Global Menu Module
class GlobalMenu {
    constructor() {
        this.currentPage = 'home';
        this.menuItems = null;
        this.isLoaded = false;
    }

    // Load menu HTML into container
    async loadMenu(containerId) {
        try {
            console.log('Fetching menu HTML from /components/menu.html');
            const response = await fetch('/components/menu.html');
            if (!response.ok) {
                throw new Error(`Failed to load menu: ${response.status} ${response.statusText}`);
            }
            const menuHTML = await response.text();
            console.log('Menu HTML loaded, length:', menuHTML.length);
            
            const container = document.getElementById(containerId);
            if (container) {
                console.log('Container found, inserting menu HTML');
                container.innerHTML = menuHTML;
                this.initializeMenu();
                this.isLoaded = true;
                console.log('Menu loaded and initialized successfully');
            } else {
                console.error('Menu container not found:', containerId);
                throw new Error(`Menu container not found: ${containerId}`);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
            throw error;
        }
    }

    // Initialize menu after loading
    initializeMenu() {
        this.menuItems = document.querySelectorAll('.menu-item');
        this.attachEventListeners();
        this.setActivePage(this.currentPage);
        console.log('Global menu initialized');
    }

    // Attach click event listeners to menu items
    attachEventListeners() {
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.target.getAttribute('data-page');
                if (page) {
                    this.navigateToPage(page);
                }
            });

            // Add hover effects
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });

            item.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    // Navigate to specific page
    navigateToPage(page) {
        console.log('Navigating to page:', page);
        
        // Update active state
        this.setActivePage(page);
        
        // Define page routes
        const routes = {
            'home': '/dashboard.html',
            'wystawcy': '/wystawcy.html',
            'wydarzenia': '/wydarzenia.html', 
            'uzytkownicy': '/uzytkownicy.html',
            'baza-danych': '/baza-danych.html'
        };

        const route = routes[page];
        if (route) {
            if (page === 'home' || page === 'uzytkownicy') {
                // Navigate to these pages (Home and Users are ready)
                window.location.href = route;
            } else {
                // Show development message for other pages
                this.showPageInDevelopment(page);
                
                // TODO: Uncomment when pages are ready
                // window.location.href = route;
            }
        }
    }

    // Set active page styling
    setActivePage(page) {
        this.currentPage = page;
        
        if (this.menuItems) {
            this.menuItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-page') === page) {
                    item.classList.add('active');
                }
            });
        }
    }

    // Show development notification
    showPageInDevelopment(page) {
        const pageNames = {
            'wystawcy': 'Baza Wystawców',
            'wydarzenia': 'Baza Wydarzeń',
            'uzytkownicy': 'Użytkownicy',
            'baza-danych': 'Baza Danych'
        };

        const pageName = pageNames[page] || page;
        this.showNotification(`Strona "${pageName}" jest w przygotowaniu`);
    }

    // Show notification
    showNotification(message) {
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

    // Auto-detect current page from URL
    autoDetectPage() {
        const path = window.location.pathname;
        const pageMap = {
            '/': 'home',
            '/dashboard.html': 'home',
            '/wystawcy.html': 'wystawcy',
            '/wydarzenia.html': 'wydarzenia',
            '/uzytkownicy.html': 'uzytkownicy',
            '/baza-danych.html': 'baza-danych'
        };

        const page = pageMap[path] || 'home';
        this.setActivePage(page);
    }
}

// Create global instance
window.globalMenu = new GlobalMenu();

// Auto-initialize when DOM is loaded (only for page detection)
document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect current page only if menu is already loaded
    if (window.globalMenu.isLoaded) {
        window.globalMenu.autoDetectPage();
    }
});

// Expose utility functions globally
window.loadGlobalMenu = function(containerId) {
    return window.globalMenu.loadMenu(containerId);
};

window.setActiveMenuPage = function(page) {
    window.globalMenu.setActivePage(page);
};

console.log('Global Menu module loaded'); 