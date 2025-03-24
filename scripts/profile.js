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

document.addEventListener('DOMContentLoaded', function () {
    const editProfileBtn = document.getElementById('editProfile');
    const displayNameInput = document.getElementById('displayName');
    const countrySelect = document.getElementById('country');
    const actionButtons = document.querySelector('.action-buttons');
    const saveButton = document.getElementById('saveChanges');
    const cancelButton = document.getElementById('cancelChanges');

    // Store original values
    let originalValues = {};

    // Toggle edit mode
    editProfileBtn.addEventListener('click', () => {
        const isEditing = displayNameInput.disabled;
        displayNameInput.disabled = !isEditing;
        countrySelect.disabled = !isEditing;
        actionButtons.style.display = isEditing ? 'flex' : 'none';

        if (isEditing) {
            editProfileBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Edit';
            editProfileBtn.style.background = '#f44336';
        } else {
            editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            editProfileBtn.style.background = 'var(--accent-color)';
        }
    });

    // Initialize Firebase Auth state observer
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDoc = await firebase.firestore().collection('Users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();

                    // Store original values
                    originalValues = {
                        displayName: userData.name || '',
                        country: userData.country || ''
                    };

                    // Set initial values
                    displayNameInput.value = originalValues.displayName;
                    countrySelect.value = originalValues.country;

                    // Update categories count
                    const categoriesCount = document.getElementById('categoriesCount');
                    const categories = userData.categories || [];
                    categoriesCount.textContent = `${categories.length} categories selected`;
                }
            } catch (error) {
                console.error("Error loading user data:", error);
                showNotification("Error loading user data", "error");
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    // Save changes
    saveButton.addEventListener('click', async () => {
        try {
            const user = firebase.auth().currentUser;
            if (user) {
                const updates = {
                    name: displayNameInput.value,
                    country: countrySelect.value
                };

                await firebase.firestore().collection('Users').doc(user.uid).update(updates);

                // Update original values
                originalValues = {
                    displayName: displayNameInput.value,
                    country: countrySelect.value
                };

                // Disable inputs and hide action buttons
                displayNameInput.disabled = true;
                countrySelect.disabled = true;
                actionButtons.style.display = 'none';

                // Reset edit button
                editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
                editProfileBtn.style.background = 'var(--accent-color)';

                showNotification("Profile updated successfully!", "success");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showNotification("Error updating profile", "error");
        }
    });

    // Cancel changes
    cancelButton.addEventListener('click', () => {
        // Restore original values
        displayNameInput.value = originalValues.displayName;
        countrySelect.value = originalValues.country;

        // Disable inputs and hide action buttons
        displayNameInput.disabled = true;
        countrySelect.disabled = true;
        actionButtons.style.display = 'none';

        // Reset edit button
        editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        editProfileBtn.style.background = 'var(--accent-color)';
    });

    // Notification function
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '1rem 2rem';
        notification.style.borderRadius = '8px';
        notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
        notification.style.color = 'white';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '0.5rem';
        notification.style.zIndex = '1000';
        notification.style.animation = 'slideIn 0.3s ease-out';

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}); 