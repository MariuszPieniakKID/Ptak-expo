// Users page functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Users page loaded');
    
    // Add click functionality to "wstecz" button
    const backButton = document.querySelector('.wstecz');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.history.back();
        });
    }

    // Add click functionality to "dodaj użytkownika" button
    const addUserButton = document.querySelector('.dodajUytkownika');
    if (addUserButton) {
        addUserButton.addEventListener('click', function() {
            alert('Funkcja dodawania użytkownika będzie dostępna wkrótce!');
        });
    }

    // Add click functionality to "wyślij nowe hasło" buttons
    const passwordButtons = document.querySelectorAll('.wylijNoweHaso');
    passwordButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Nowe hasło zostało wysłane!');
        });
    });

    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.dodajUytkownika, .wylijNoweHaso, .wstecz');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.opacity = '0.7';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
});

// Logout function
function logout() {
    if (confirm('Czy na pewno chcesz się wylogować?')) {
        // Redirect to login page
        window.location.href = '/login.html';
    }
} 