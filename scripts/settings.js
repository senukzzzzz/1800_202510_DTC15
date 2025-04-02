/**
 * Settings page JavaScript - Handles user interface interactions
 * Including profile dropdown and sign out functionality
 */

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Get references to DOM elements
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');

    /**
     * Profile Dropdown Toggle
     * Shows/hides the profile menu when clicking the profile button
     * Stops event propagation to prevent immediate closing
     */
    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    /**
     * Close Dropdowns on Outside Click
     * Closes profile dropdown when clicking outside
     */
    document.addEventListener('click', function (e) {
        // Close profile dropdown if clicking outside
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    /**
     * Sign Out Handler
     * Handles user sign out through Firebase Authentication
     * Redirects to index.html on successful sign out
     */
    signOutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
}); 