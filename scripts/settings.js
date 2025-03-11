/**
 * Settings page JavaScript - Handles user interface interactions
 * Including profile dropdown, mobile menu, and sign out functionality
 */

// Wait for DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Get references to DOM elements
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

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
     * Mobile Menu Animation
     * Handles the mobile menu toggle with smooth animations
     * Uses setTimeout for proper transition timing
     */
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            if (mobileMenu.style.display === 'block') {
                // Hide menu with fade-out and slide-up animation
                mobileMenu.style.opacity = '0';
                mobileMenu.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    mobileMenu.style.display = 'none';
                }, 300); // Wait for animation to complete
            } else {
                // Show menu with fade-in and slide-down animation
                mobileMenu.style.display = 'block';
                setTimeout(() => {
                    mobileMenu.style.opacity = '1';
                    mobileMenu.style.transform = 'translateY(0)';
                }, 10); // Small delay for display:block to take effect
            }
        });
    }

    /**
     * Close Dropdowns on Outside Click
     * Closes both profile dropdown and mobile menu when clicking outside
     * Includes animation for mobile menu closing
     */
    document.addEventListener('click', function (e) {
        // Close profile dropdown if clicking outside
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
        
        // Close mobile menu if clicking outside
        if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            if (mobileMenu.style.display === 'block') {
                // Apply same closing animation as toggle
                mobileMenu.style.opacity = '0';
                mobileMenu.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    mobileMenu.style.display = 'none';
                }, 300);
            }
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