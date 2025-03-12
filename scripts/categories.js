/**
 * Categories Management System
 * Handles the application's category selection, storage, and display.
 * Manages both local storage and Firestore synchronization for user categories.
 */

// DOM Elements
let categoryPopup;
let saveCategories;
let skipCategories;

/**
 * Initializes the categories system
 * Sets up event listeners and checks for existing categories
 */
function initializeCategories() {
    // Get DOM elements
    categoryPopup = document.getElementById('categoryPopup');
    saveCategories = document.getElementById('saveCategories');
    skipCategories = document.getElementById('skipCategories');

    // Set up category label click handlers
    setupCategoryLabels();

    // Check user's category status
    checkUserCategories();
}

/**
 * Sets up click handlers for category labels
 * Prevents default behavior and handles checkbox toggling
 */
function setupCategoryLabels() {
    document.querySelectorAll('.category-label').forEach(label => {
        label.addEventListener('click', function (e) {
            e.preventDefault();
            const checkbox = document.getElementById(this.getAttribute('for'));
            checkbox.checked = !checkbox.checked;
            e.stopPropagation();
        });
    });
}

/**
 * Checks user's category status and shows popup if needed
 * Handles both authenticated and non-authenticated users
 */
function checkUserCategories() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            checkAuthenticatedUserCategories(user);
        } else {
            checkLocalStorageCategories();
        }
    });
}

/**
 * Checks categories for authenticated users
 * @param {Object} user - Firebase user object
 */
function checkAuthenticatedUserCategories(user) {
    const db = firebase.firestore();

    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists || !doc.data().hasSeenCategoryPopup) {
                showCategoryPopup();
                if (doc.exists && doc.data().categories) {
                    preSelectCategories(doc.data().categories);
                }
            } else if (doc.data().categories) {
                updateCategoriesDisplay(doc.data().categories);
            }
        })
        .catch(error => {
            console.error("Error checking user categories:", error);
        });
}

/**
 * Checks categories stored in localStorage
 */
function checkLocalStorageCategories() {
    const hasVisited = localStorage.getItem('hasVisitedBefore');

    if (!hasVisited) {
        showCategoryPopup();
    } else {
        const savedCategories = localStorage.getItem('userCategories');
        if (savedCategories) {
            updateCategoriesDisplay(JSON.parse(savedCategories));
        }
    }
}

/**
 * Shows the category selection popup
 */
function showCategoryPopup() {
    categoryPopup.classList.add('show');
    document.body.classList.add('popup-open');
}

/**
 * Pre-selects categories in the popup
 * @param {Array} categories - Array of category IDs
 */
function preSelectCategories(categories) {
    categories.forEach(category => {
        const checkbox = document.getElementById(`category-${category}`);
        if (checkbox) checkbox.checked = true;
    });
}

/**
 * Saves selected categories
 * Handles both local storage and Firestore storage
 */
function saveSelectedCategories() {
    const selectedCategories = getSelectedCategories();

    // Save to localStorage
    localStorage.setItem('userCategories', JSON.stringify(selectedCategories));
    localStorage.setItem('hasVisitedBefore', 'true');

    // Save to Firebase if user is authenticated
    saveCategoriesToFirebase(selectedCategories);

    // Close popup and update display
    closeCategoryPopup();
    updateCategoriesDisplay(selectedCategories);
}

/**
 * Gets currently selected categories
 * @returns {Array} Array of selected category IDs
 */
function getSelectedCategories() {
    const selectedCategories = [];
    document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
        selectedCategories.push(checkbox.id.replace('category-', ''));
    });
    return selectedCategories;
}

/**
 * Saves categories to Firebase
 * @param {Array} categories - Array of category IDs
 */
function saveCategoriesToFirebase(categories) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const db = firebase.firestore();

            db.collection('users').doc(user.uid).set({
                categories: categories,
                hasSeenCategoryPopup: true,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true })
                .then(() => {
                    console.log("User categories saved to Firebase");
                })
                .catch((error) => {
                    console.error("Error saving categories to Firebase:", error);
                });
        }
    });
}

/**
 * Handles skipping category selection
 */
function skipCategorySelection() {
    localStorage.setItem('hasVisitedBefore', 'true');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).set({
                hasSeenCategoryPopup: true,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    });

    closeCategoryPopup();
}

/**
 * Closes the category popup with animation
 */
function closeCategoryPopup() {
    categoryPopup.classList.add('hide');
    setTimeout(() => {
        categoryPopup.classList.remove('show', 'hide');
        document.body.classList.remove('popup-open');
    }, 300);
}

/**
 * Updates the UI to reflect selected categories
 * @param {Array} categories - Array of selected category IDs
 */
function updateCategoriesDisplay(categories) {
    console.log('Selected categories:', categories);
    // Update the stat card for categories
    const categoryCount = document.querySelector('.stat-number');
    if (categoryCount && categories.length > 0) {
        categoryCount.textContent = categories.length;
    }
}

// Initialize categories system when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeCategories();

    // Set up event listeners for buttons
    if (saveCategories) {
        saveCategories.addEventListener('click', saveSelectedCategories);
    }
    if (skipCategories) {
        skipCategories.addEventListener('click', skipCategorySelection);
    }
}); 