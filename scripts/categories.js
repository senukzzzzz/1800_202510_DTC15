// Remove the Firebase initialization since it's already done in authentication.js
// Just use the existing auth and db instances

// Global variables to track changes
let originalCategories = new Set();
let currentCategories = new Set();
let hasUnsavedChanges = false;

// Define all available categories
const allCategories = {
    'technology': {
        icon: 'fas fa-microchip',
        description: 'Tech News & Updates'
    },
    'business': {
        icon: 'fas fa-chart-line',
        description: 'Business & Finance'
    },
    'science': {
        icon: 'fas fa-flask',
        description: 'Scientific Discoveries'
    },
    'health': {
        icon: 'fas fa-heartbeat',
        description: 'Health & Wellness'
    },
    'entertainment': {
        icon: 'fas fa-film',
        description: 'Entertainment News'
    },
    'sports': {
        icon: 'fas fa-trophy',
        description: 'Sports Coverage'
    },
    'politics': {
        icon: 'fas fa-landmark',
        description: 'Political News'
    },
    'education': {
        icon: 'fas fa-graduation-cap',
        description: 'Educational Content'
    },
    'lifestyle': {
        icon: 'fas fa-coffee',
        description: 'Lifestyle & Culture'
    }
};

// Action buttons container
const actionButtonsHTML = `
    <div class="action-buttons" style="display: none; justify-content: center; gap: 1rem; margin-top: 2rem;">
        <button id="saveChanges" class="follow-btn active">
            <i class="fas fa-save"></i>
            <span>Save Changes</span>
        </button>
        <button id="cancelChanges" class="follow-btn">
            <i class="fas fa-times"></i>
            <span>Cancel</span>
        </button>
    </div>
`;

// Function to create a category card
function createCategoryCard(category, isFollowed) {
    const categoryInfo = allCategories[category] || {
        icon: 'fas fa-tag',
        description: 'Category description'
    };

    return `
        <div class="category-card ${isFollowed ? 'followed' : ''}" data-category="${category}" role="button" tabindex="0">
            <div class="category-icon">
                <i class="${categoryInfo.icon}"></i>
            </div>
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <p>${categoryInfo.description}</p>
            <div class="follow-btn ${isFollowed ? 'active' : ''}">
                <i class="fas ${isFollowed ? 'fa-check' : 'fa-plus'}"></i>
                <span>${isFollowed ? 'Following' : 'Follow'}</span>
            </div>
        </div>
    `;
}

// Function to update categories display
function updateCategoriesDisplay() {
    console.log('Updating categories display');
    console.log('Current categories:', Array.from(currentCategories));

    const followingGrid = document.getElementById('following-grid');
    const moreCategoriesGrid = document.getElementById('more-categories-grid');

    if (!followingGrid || !moreCategoriesGrid) {
        console.error('Could not find grid containers');
        return;
    }

    // Clear existing content
    followingGrid.innerHTML = '';
    moreCategoriesGrid.innerHTML = '';

    // Update the Following count
    const followingCount = currentCategories.size;
    const followingHeader = document.querySelector('.followed-categories .section-header h2');
    if (followingHeader) {
        followingHeader.textContent = `Following (${followingCount})`;
    }

    // Add followed categories to Following section
    if (currentCategories.size === 0) {
        followingGrid.innerHTML = `
            <div class="no-categories-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p style="color: var(--text-color-secondary);">You haven't followed any categories yet.</p>
            </div>
        `;
    } else {
        Array.from(currentCategories).forEach(category => {
            console.log('Adding followed category to grid:', category);
            followingGrid.insertAdjacentHTML('beforeend', createCategoryCard(category, true));
        });
    }

    // Add remaining categories to More Categories section
    Object.keys(allCategories).forEach(category => {
        if (!currentCategories.has(category)) {
            console.log('Adding unfollowed category to grid:', category);
            moreCategoriesGrid.insertAdjacentHTML('beforeend', createCategoryCard(category, false));
        }
    });

    // Re-attach click listeners
    attachClickListeners();
}

// Function to toggle category selection
function toggleCategory(category) {
    console.log('Toggling category:', category);

    if (currentCategories.has(category)) {
        console.log('Removing category:', category);
        currentCategories.delete(category);
    } else {
        console.log('Adding category:', category);
        currentCategories.add(category);
    }

    console.log('Current categories after toggle:', Array.from(currentCategories));
    updateCategoriesDisplay();
    checkForChanges();
}

// Function to attach click listeners to category cards
function attachClickListeners() {
    document.querySelectorAll('.category-card').forEach(card => {
        const category = card.getAttribute('data-category');

        // Remove old listeners by cloning and replacing the card
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        // Add click listener to the entire card
        newCard.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Card clicked for category:', category);
            toggleCategory(category);
        });

        // Add keyboard accessibility
        newCard.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCategory(category);
            }
        });
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // Add action buttons to the page
    document.querySelector('.main-content').insertAdjacentHTML('beforeend', actionButtonsHTML);

    const actionButtons = document.querySelector('.action-buttons');
    const saveButton = document.getElementById('saveChanges');
    const cancelButton = document.getElementById('cancelChanges');

    // Initialize with user's categories
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');

        if (user) {
            try {
                const userDoc = await firebase.firestore().collection('Users').doc(user.uid).get();
                console.log('User document exists:', userDoc.exists);

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('User data:', userData);

                    // Initialize categories from user data
                    originalCategories = new Set(userData.categories || []);
                    currentCategories = new Set(userData.categories || []);
                    console.log('Loaded categories:', Array.from(currentCategories));
                    updateCategoriesDisplay();
                } else {
                    // Create new user document with empty categories
                    await firebase.firestore().collection('Users').doc(user.uid).set({
                        categories: []
                    });
                    originalCategories = new Set();
                    currentCategories = new Set();
                    updateCategoriesDisplay();
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                showNotification('Failed to load categories', 'error');
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
                const categoriesToSave = Array.from(currentCategories);
                console.log('Saving categories:', categoriesToSave);

                await firebase.firestore().collection('Users').doc(user.uid).update({
                    categories: categoriesToSave
                });

                originalCategories = new Set(currentCategories);
                hasUnsavedChanges = false;
                actionButtons.style.display = 'none';
                showNotification('Categories saved successfully!', 'success');

                // Refresh the display
                updateCategoriesDisplay();
            }
        } catch (error) {
            console.error('Error saving categories:', error);
            showNotification('Failed to save categories', 'error');
        }
    });

    // Cancel changes
    cancelButton.addEventListener('click', () => {
        currentCategories = new Set(originalCategories);
        updateCategoriesDisplay();
        hasUnsavedChanges = false;
        actionButtons.style.display = 'none';
    });
});

// Function to check for unsaved changes
function checkForChanges() {
    const hasChanges = !setsAreEqual(originalCategories, currentCategories);
    hasUnsavedChanges = hasChanges;
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.style.display = hasChanges ? 'flex' : 'none';
    }
}

// Function to compare sets
function setsAreEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
        if (!set2.has(item)) return false;
    }
    return true;
}

// Function to show notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    // Styles for notification
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

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
}); 