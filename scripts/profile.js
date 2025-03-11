/**
 * Profile Menu Handler
 * Manages the profile dropdown menu functionality including animations,
 * click events, and sign out process
 */

document.addEventListener('DOMContentLoaded', function () {
    // Get references to DOM elements
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');

    /**
     * Initialize dropdown menu state
     * Set initial styles for the dropdown to enable smooth animations
     */
    dropdownMenu.style.opacity = '0';
    dropdownMenu.style.display = 'none';
    dropdownMenu.style.transform = 'translateY(-10px)';

    /**
     * Profile Button Click Handler
     * Toggles the dropdown menu with animation when clicking the profile button
     * Uses CSS transitions for smooth animation effects
     */
    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent event from bubbling to document
        
        if (dropdownMenu.style.display === 'none') {
            // Show dropdown with animation
            dropdownMenu.style.display = 'block';
            dropdownMenu.offsetHeight; // Force a reflow to enable the transition
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.transform = 'translateY(0)';
            dropdownMenu.classList.add('show');
        } else {
            // Hide dropdown with animation
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.transform = 'translateY(-10px)';
            dropdownMenu.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                dropdownMenu.style.display = 'none';
            }, 200); // Match the CSS transition duration
        }
    });

    /**
     * Document Click Handler
     * Closes the dropdown menu when clicking outside
     * Includes the same animation as the toggle
     */
    document.addEventListener('click', function (e) {
        // Check if click is outside menu and button, and menu is visible
        if (!dropdownMenu.contains(e.target) && 
            !profileBtn.contains(e.target) && 
            dropdownMenu.style.display === 'block') {
            
            // Apply closing animation
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.transform = 'translateY(-10px)';
            dropdownMenu.classList.remove('show');
            
            // Hide menu after animation
            setTimeout(() => {
                dropdownMenu.style.display = 'none';
            }, 200);
        }
    });

    /**
     * Sign Out Handler
     * Manages the sign out process using Firebase Authentication
     * Redirects to index.html after successful sign out
     */
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out:', error);
            });
        });
    }
}); 