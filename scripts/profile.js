/**
 * Profile Page JavaScript
 * Manages the profile form, user data loading/saving, and UI interactions
 */

document.addEventListener('DOMContentLoaded', function () {
    // Get references to DOM elements
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');
    const editProfileBtn = document.getElementById('editProfile');
    const saveChangesBtn = document.getElementById('saveChanges');
    const cancelChangesBtn = document.getElementById('cancelChanges');
    const displayNameInput = document.getElementById('displayName');
    const countrySelect = document.getElementById('country');
    const actionButtons = document.querySelector('.action-buttons');
    const categoriesCountElement = document.getElementById('categoriesCount');

    // Store original values for cancellation
    let originalDisplayName = '';
    let originalCountry = '';

    /**
     * Initialize dropdown menu state
     */
    if (dropdownMenu) {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.display = 'none';
        dropdownMenu.style.transform = 'translateY(-10px)';
    }

    /**
     * Load user profile data from Firebase
     * Gets user information and populates the form fields
     */
    function loadUserProfile() {
        const user = firebase.auth().currentUser;
        
        if (user) {
            // Set display name from auth if available
            if (user.displayName && displayNameInput) {
                displayNameInput.value = user.displayName;
                originalDisplayName = user.displayName;
            }
            
            // Get additional user data from Firestore
            db.collection('Users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        // Set display name from Firestore if available and not set from auth
                        if (userData.displayName && !displayNameInput?.value && displayNameInput) {
                            displayNameInput.value = userData.displayName;
                            originalDisplayName = userData.displayName;
                        }
                        
                        // Set country if available
                        if (userData.country && countrySelect) {
                            countrySelect.value = userData.country;
                            originalCountry = userData.country;
                        }
                        
                        // Update categories count
                        if (userData.categories && Array.isArray(userData.categories) && categoriesCountElement) {
                            categoriesCountElement.textContent = userData.categories.length;
                        }
                    } else {
                        // Create user document if it doesn't exist
                        db.collection('Users').doc(user.uid).set({
                            displayName: user.displayName || '',
                            email: user.email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error loading user profile:', error);
                    showNotification('Failed to load profile data', 'error');
                });
        }
    }

    /**
     * Enable editing of profile fields
     */
    function enableEditing() {
        displayNameInput.disabled = false;
        countrySelect.disabled = false;
        actionButtons.style.display = 'flex';
        editProfileBtn.style.display = 'none';
    }

    /**
     * Disable editing and reset fields to original values
     */
    function disableEditing() {
        displayNameInput.disabled = true;
        countrySelect.disabled = true;
        actionButtons.style.display = 'none';
        editProfileBtn.style.display = 'block';
        
        // Reset to original values
        displayNameInput.value = originalDisplayName;
        countrySelect.value = originalCountry;
    }

    /**
     * Save profile changes to Firebase
     */
    function saveProfileChanges() {
        const user = firebase.auth().currentUser;
        
        if (!user) return;
        
        const newDisplayName = displayNameInput.value.trim();
        const newCountry = countrySelect.value;
        
        // Validate display name
        if (!newDisplayName) {
            showNotification('Display name cannot be empty', 'error');
            return;
        }
        
        // Show loading state
        saveChangesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveChangesBtn.disabled = true;
        
        // Update auth display name
        const authUpdate = newDisplayName !== user.displayName ? 
            user.updateProfile({ displayName: newDisplayName }) : 
            Promise.resolve();
        
        // Update Firestore document
        const firestoreUpdate = db.collection('Users').doc(user.uid).update({
            displayName: newDisplayName,
            country: newCountry,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Execute both updates
        Promise.all([authUpdate, firestoreUpdate])
            .then(() => {
                // Update original values
                originalDisplayName = newDisplayName;
                originalCountry = newCountry;
                
                // Show success notification
                showNotification('Profile updated successfully', 'success');
                
                // Disable editing
                disableEditing();
            })
            .catch((error) => {
                console.error('Error updating profile:', error);
                showNotification('Failed to update profile', 'error');
            })
            .finally(() => {
                // Reset button state
                saveChangesBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
                saveChangesBtn.disabled = false;
            });
    }

    /**
     * Show notification message
     * @param {string} message Message to display
     * @param {string} type Type of notification ('success' or 'error')
     */
    function showNotification(message, type = 'success') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            
            const icon = document.createElement('i');
            icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            
            notification.appendChild(icon);
            notification.appendChild(document.createTextNode(message));
            
            document.body.appendChild(notification);
        } else {
            // Update existing notification
            notification.className = 'notification';
            notification.innerHTML = '';
            
            const icon = document.createElement('i');
            icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            
            notification.appendChild(icon);
            notification.appendChild(document.createTextNode(message));
        }
        
        // Add type class
        notification.classList.add(type);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Profile Button Click Handler
     */
    if (profileBtn) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            
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
                }, 200);
            }
        });
    }

    /**
     * Document Click Handler for closing dropdown
     */
    document.addEventListener('click', function (e) {
        // Check if click is outside menu and button, and menu is visible
        if (dropdownMenu && !dropdownMenu.contains(e.target) && 
            profileBtn && !profileBtn.contains(e.target) && 
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
     */
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out:', error);
                showNotification('Failed to sign out', 'error');
            });
        });
    }

    /**
     * Edit Profile Button Handler
     */
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            enableEditing();
        });
    }

    /**
     * Save Changes Button Handler
     */
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', function() {
            saveProfileChanges();
        });
    }

    /**
     * Cancel Changes Button Handler
     */
    if (cancelChangesBtn) {
        cancelChangesBtn.addEventListener('click', function() {
            disableEditing();
        });
    }

    // Load user profile data when page loads
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadUserProfile();
        } else {
            // Redirect to login if not signed in
            window.location.href = 'index.html';
        }
    });
}); 