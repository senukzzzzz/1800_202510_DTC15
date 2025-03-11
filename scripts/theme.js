/**
 * Theme Management System
 * Handles the application's theme switching between light and dark modes.
 * Persists theme preferences in both localStorage and Firestore for logged-in users.
 */

/**
 * Initializes the theme system
 * 1. Checks localStorage for saved preference
 * 2. Sets up theme toggle on settings page
 * 3. Syncs with Firestore if user is logged in
 */
function initializeTheme() {
    // Check localStorage first for theme preference
    // Default to dark mode if no preference is stored
    const isDarkMode = localStorage.getItem('darkMode') !== 'light';
    applyTheme(!isDarkMode);

    // Set up theme toggle switch if on settings page
    const darkModeToggle = document.querySelector('input[type="checkbox"]');
    if (darkModeToggle) {
        // Set initial state of toggle
        darkModeToggle.checked = isDarkMode;
        // Add change listener for theme toggle
        darkModeToggle.addEventListener('change', function() {
            const isLightMode = !this.checked;
            updateTheme(isLightMode);
        });
    }

    /**
     * Firebase Authentication State Observer
     * Syncs theme preference with Firestore when user is logged in
     */
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Fetch user preferences from Firestore
            db.collection("Users").doc(user.uid).get().then((doc) => {
                if (doc.exists && doc.data().hasOwnProperty('darkMode')) {
                    const isDarkMode = doc.data().darkMode;
                    
                    // Apply theme from Firestore
                    applyTheme(!isDarkMode);
                    
                    // Update toggle switch if on settings page
                    if (darkModeToggle) {
                        darkModeToggle.checked = isDarkMode;
                    }

                    // Sync localStorage with Firestore preference
                    localStorage.setItem('darkMode', isDarkMode ? 'dark' : 'light');
                }
            }).catch((error) => {
                console.error("Error getting user preferences:", error);
            });
        }
    });
}

/**
 * Applies theme to the document
 * Toggles 'light-mode' class on body element
 * @param {boolean} isLightMode - True for light mode, false for dark mode
 */
function applyTheme(isLightMode) {
    if (isLightMode) {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

/**
 * Updates theme preference and persists it
 * 1. Applies theme to document
 * 2. Saves to localStorage
 * 3. Updates Firestore if user is logged in
 * @param {boolean} isLightMode - True for light mode, false for dark mode
 */
function updateTheme(isLightMode) {
    // Apply theme to document
    applyTheme(isLightMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isLightMode ? 'light' : 'dark');
    
    // Update Firestore if user is authenticated
    const user = firebase.auth().currentUser;
    if (user) {
        db.collection("Users").doc(user.uid).update({
            darkMode: !isLightMode
        }).catch((error) => {
            console.error("Error updating dark mode preference:", error);
        });
    }
}

// Initialize theme system when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTheme); 