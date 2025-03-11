// Theme management functionality
function initializeTheme() {
    // Check localStorage first
    const isDarkMode = localStorage.getItem('darkMode') !== 'light';
    applyTheme(!isDarkMode);

    // Set up theme toggle if on settings page
    const darkModeToggle = document.querySelector('input[type="checkbox"]');
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
        darkModeToggle.addEventListener('change', function() {
            const isLightMode = !this.checked;
            updateTheme(isLightMode);
        });
    }

    // Then check Firestore if user is logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            db.collection("Users").doc(user.uid).get().then((doc) => {
                if (doc.exists && doc.data().hasOwnProperty('darkMode')) {
                    const isDarkMode = doc.data().darkMode;
                    applyTheme(!isDarkMode);
                    
                    // Update checkbox if we're on the settings page
                    if (darkModeToggle) {
                        darkModeToggle.checked = isDarkMode;
                    }

                    // Also update localStorage to keep in sync
                    localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
                }
            }).catch((error) => {
                console.error("Error getting user preferences:", error);
            });
        }
    });
}

// Function to apply theme without side effects
function applyTheme(isLightMode) {
    if (isLightMode) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

// Function to update theme and save preferences
function updateTheme(isLightMode) {
    applyTheme(isLightMode);
    localStorage.setItem('darkMode', isLightMode ? 'light' : 'dark');
    
    // Save preference to Firestore if user is logged in
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("Users").doc(user.uid).update({
            darkMode: !isLightMode
        }).catch((error) => {
            console.error("Error updating dark mode preference:", error);
        });
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme); 