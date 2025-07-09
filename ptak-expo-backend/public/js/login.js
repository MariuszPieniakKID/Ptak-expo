// Login form functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
        // Verify token and redirect if valid
        verifyExistingToken(existingToken);
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const emailPlaceholder = document.getElementById('email-placeholder');
    const passwordPlaceholder = document.getElementById('password-placeholder');

    // Hide/show placeholders based on input focus and value
    function handleEmailFocus() {
        emailPlaceholder.style.display = 'none';
    }

    function handleEmailBlur() {
        if (!emailInput.value.trim()) {
            emailPlaceholder.style.display = 'block';
        }
    }

    function handlePasswordFocus() {
        passwordPlaceholder.style.display = 'none';
    }

    function handlePasswordBlur() {
        if (!passwordInput.value.trim()) {
            passwordPlaceholder.style.display = 'block';
        }
    }

    function handleEmailInput() {
        if (emailInput.value.trim()) {
            emailPlaceholder.style.display = 'none';
        } else {
            emailPlaceholder.style.display = 'block';
        }
    }

    function handlePasswordInput() {
        if (passwordInput.value.trim()) {
            passwordPlaceholder.style.display = 'none';
        } else {
            passwordPlaceholder.style.display = 'block';
        }
    }

    // Add event listeners for focus/blur/input
    emailInput.addEventListener('focus', handleEmailFocus);
    emailInput.addEventListener('blur', handleEmailBlur);
    emailInput.addEventListener('input', handleEmailInput);
    passwordInput.addEventListener('focus', handlePasswordFocus);
    passwordInput.addEventListener('blur', handlePasswordBlur);
    passwordInput.addEventListener('input', handlePasswordInput);

    // Hide placeholders if inputs have values on load
    if (emailInput.value) {
        emailPlaceholder.style.display = 'none';
    }
    if (passwordInput.value) {
        passwordPlaceholder.style.display = 'none';
    }

    // Handle login form submission
    loginButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Clear previous messages
        hideMessages();

        // Basic validation
        if (!email || !password) {
            showError('Proszę wprowadzić adres e-mail i hasło');
            return;
        }

        if (!isValidEmail(email)) {
            showError('Proszę wprowadzić prawidłowy adres e-mail');
            return;
        }

        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage (using consistent key name)
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showSuccess('Logowanie pomyślne! Przekierowanie...');
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                showError(data.message || 'Błąd logowania');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Błąd połączenia z serwerem');
        }
    });

    // Handle Enter key press
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideMessages();
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    function hideMessages() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});

// Verify existing token function
async function verifyExistingToken(token) {
    try {
        const response = await fetch('/api/v1/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Token is valid, redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            // Token is invalid, remove from storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        // Remove invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
}

// Forgot password function (called from HTML onclick)
function showForgotPassword() {
    alert('Funkcja przypomnienia hasła zostanie wkrótce dodana.\n\nTymczasowo skontaktuj się z administratorem:\nadmin@ptakexpo.pl');
} 