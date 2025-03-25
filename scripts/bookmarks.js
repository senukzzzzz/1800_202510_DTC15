/**
 * Bookmarks Page JavaScript
 * Handles displaying and managing bookmarked articles with modern UX
 */

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeBookmarksPage);

function initializeBookmarksPage() {
    // Set up UI components and event listeners
    setupMobileMenu();
    setupProfileDropdown();
    setupBookmarkActions();
    loadBookmarks();
}

/**
 * Mobile Menu Functionality
 * Handles the mobile menu toggle with smooth animations
 */
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            if (mobileMenu.style.display === 'block') {
                // Hide menu with animation
                mobileMenu.style.opacity = '0';
                mobileMenu.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    mobileMenu.style.display = 'none';
                }, 300);
            } else {
                // Show menu with animation
                mobileMenu.style.display = 'block';
                setTimeout(() => {
                    mobileMenu.style.opacity = '1';
                    mobileMenu.style.transform = 'translateY(0)';
                }, 10);
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenu.style.display === 'block' &&
                !mobileMenu.contains(e.target) &&
                !mobileMenuToggle.contains(e.target)) {

                mobileMenu.style.opacity = '0';
                mobileMenu.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    mobileMenu.style.display = 'none';
                }, 300);
            }
        });
    }
}

/**
 * Profile Dropdown
 * Manages the profile dropdown menu with animations
 */
function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');

    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        // Sign out functionality
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                firebase.auth().signOut().then(() => {
                    window.location.href = 'index.html';
                }).catch((error) => {
                    console.error('Error signing out:', error);
                    showToast('Failed to sign out. Please try again.', 'error');
                });
            });
        }
    }
}

/**
 * Load and display bookmarks
 * Gets bookmarks from localStorage and creates UI elements
 */
function loadBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    const emptyState = document.getElementById('emptyState');
    const bookmarks = bookmarkStore.getBookmarks();

    // Update bookmarks display
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        renderBookmarks(bookmarks);
    }

    // Initialize filters
    setupFilters(bookmarks);
}

/**
 * Render bookmark items in the UI
 * @param {Array} bookmarks Array of bookmark objects to display
 */
function renderBookmarks(bookmarks) {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = '';

    // Sort bookmarks by date (most recent first by default)
    const sortedBookmarks = sortBookmarks(bookmarks);

    // Render each bookmark as a card
    sortedBookmarks.forEach(bookmark => {
        const bookmarkItem = createBookmarkItem(bookmark);
        bookmarksList.appendChild(bookmarkItem);
    });

    // Update the stats on the main page if available
    updateBookmarkStats(bookmarks.length);
}

/**
 * Create a bookmark item element
 * @param {Object} bookmark The bookmark object to render
 * @returns {HTMLElement} The bookmark item element
 */
function createBookmarkItem(bookmark) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.id = bookmark.id;
    item.dataset.category = bookmark.category || 'uncategorized';

    // Set default image if not available
    const imgSrc = bookmark.urlToImage || 'https://via.placeholder.com/300x200?text=No+Image';

    // Format date for display
    const bookmarkDate = getTimeAgo(bookmark.bookmarkedAt);

    item.innerHTML = `
        <div class="bookmark-image">
            <img src="${imgSrc}" alt="${bookmark.title}">
            <span class="bookmark-category">${bookmark.category || 'General'}</span>
        </div>
        <div class="bookmark-content">
            <h3>${bookmark.title}</h3>
            <p>${bookmark.description || 'No description available'}</p>
            <div class="bookmark-meta">
                <span class="bookmark-date">Saved ${bookmarkDate}</span>
                <div class="bookmark-actions">
                    <button class="action-btn read-btn" data-url="${bookmark.url}">
                        <i class="fas fa-book-open"></i>
                        Read
                    </button>
                    <button class="action-btn remove-btn" data-id="${bookmark.id}">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;

    return item;
}

/**
 * Format a date string to "time ago" format
 * @param {string} dateString ISO date string
 * @returns {string} Formatted time ago string
 */
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
        return `${Math.floor(diffDay / 30)} months ago`;
    } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
        return 'just now';
    }
}

/**
 * Show empty state when no bookmarks are present
 * @param {HTMLElement} container The container to show the empty state in
 */
function showEmptyState(container) {
    const emptyState = document.getElementById('emptyState');
    const bookmarksList = document.getElementById('bookmarksList');

    bookmarksList.innerHTML = '';
    emptyState.style.display = 'flex';

    // Hide filter empty state if it's visible
    document.getElementById('filterEmptyState').style.display = 'none';
}

/**
 * Set up all bookmark-related actions
 * Manages event listeners for bookmark operations
 */
function setupBookmarkActions() {
    const bookmarksList = document.getElementById('bookmarksList');
    const clearBtn = document.getElementById('clearBookmarks');
    const confirmModal = document.getElementById('confirmModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const closeModal = document.querySelector('.close-modal');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');

    // Individual bookmark removal
    bookmarksList.addEventListener('click', (e) => {
        // Handle Read button click
        if (e.target.closest('.read-btn')) {
            const readBtn = e.target.closest('.read-btn');
            const url = readBtn.dataset.url;
            if (url) {
                // Add reading animation
                const bookmarkItem = readBtn.closest('.bookmark-item');
                bookmarkItem.classList.add('reading');

                // Open article in new tab after short delay
                setTimeout(() => {
                    window.open(url, '_blank');
                    bookmarkItem.classList.remove('reading');
                }, 300);
            }
        }

        // Handle Remove button click
        if (e.target.closest('.remove-btn')) {
            const removeBtn = e.target.closest('.remove-btn');
            const id = removeBtn.dataset.id;
            if (id) {
                const bookmarkItem = removeBtn.closest('.bookmark-item');

                // Add removal animation
                bookmarkItem.classList.add('removing');

                // Remove from localStorage and DOM after animation
                setTimeout(() => {
                    const result = bookmarkStore.removeBookmark(id);
                    if (result) {
                        bookmarkItem.remove();

                        // Show success toast
                        showToast('Bookmark removed successfully');

                        // Check if all bookmarks are removed
                        const remainingBookmarks = bookmarkStore.getBookmarks();
                        if (remainingBookmarks.length === 0) {
                            showEmptyState();
                        }

                        // Update stats
                        updateBookmarkStats(remainingBookmarks.length);
                    }
                }, 300);
            }
        }
    });

    // Open confirmation modal for clearing all bookmarks
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            confirmModal.classList.add('show');
            // Add animation class to modal content
            const modalContent = confirmModal.querySelector('.modal-content');
            modalContent.classList.add('modal-appear');
        });
    }

    // Close modal without deleting
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => {
            confirmModal.classList.remove('show');
        });
    }

    // Close button for modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            confirmModal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.remove('show');
        }
    });

    // Confirm deletion of all bookmarks
    if (confirmDelete) {
        confirmDelete.addEventListener('click', () => {
            // Clear all bookmarks from storage
            bookmarkStore.clearAll();

            // Hide modal with animation
            confirmModal.classList.remove('show');

            // Show empty state
            showEmptyState();

            // Show success toast
            showToast('All bookmarks cleared');

            // Update stats
            updateBookmarkStats(0);
        });
    }

    // Set up filter reset buttons
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', resetFilters);
    }
}

/**
 * Set up filter functionality
 * @param {Array} bookmarks Array of bookmark objects
 */
function setupFilters(bookmarks) {
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (categoryFilter && dateFilter) {
        // Populate category filter with available categories
        populateCategoryFilter(bookmarks);

        // Add event listeners to filters
        categoryFilter.addEventListener('change', applyFilters);
        dateFilter.addEventListener('change', applyFilters);
    }
}

/**
 * Populate category filter with available categories from bookmarks
 * @param {Array} bookmarks Array of bookmark objects
 */
function populateCategoryFilter(bookmarks) {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = new Set(['all']);

    // Extract unique categories from bookmarks
    bookmarks.forEach(bookmark => {
        if (bookmark.category) {
            categories.add(bookmark.category.toLowerCase());
        }
    });

    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

    // Add category options
    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryFilter.appendChild(option);
        }
    });
}

/**
 * Apply filters to bookmarks
 */
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    const bookmarksList = document.getElementById('bookmarksList');
    const filterEmptyState = document.getElementById('filterEmptyState');
    const emptyState = document.getElementById('emptyState');

    // Get all bookmarks
    const bookmarks = bookmarkStore.getBookmarks();

    if (bookmarks.length === 0) {
        showEmptyState();
        return;
    }

    // Get filter values
    const categoryValue = categoryFilter.value;
    const dateValue = dateFilter.value;

    // Filter bookmarks
    let filteredBookmarks = [...bookmarks];

    // Apply category filter
    if (categoryValue !== 'all') {
        filteredBookmarks = filteredBookmarks.filter(bookmark =>
            (bookmark.category && bookmark.category.toLowerCase() === categoryValue.toLowerCase())
        );
    }

    // Sort by date
    filteredBookmarks = sortBookmarks(filteredBookmarks, dateValue === 'oldest');

    // Show filtered results or empty state
    if (filteredBookmarks.length === 0) {
        bookmarksList.innerHTML = '';
        emptyState.style.display = 'none';
        filterEmptyState.style.display = 'flex';
    } else {
        filterEmptyState.style.display = 'none';
        emptyState.style.display = 'none';
        renderBookmarks(filteredBookmarks);
    }
}

/**
 * Sort bookmarks by date
 * @param {Array} bookmarks Array of bookmark objects
 * @param {boolean} oldestFirst Whether to sort oldest first
 * @returns {Array} Sorted bookmarks array
 */
function sortBookmarks(bookmarks, oldestFirst = false) {
    return [...bookmarks].sort((a, b) => {
        const dateA = new Date(a.bookmarkedAt || 0);
        const dateB = new Date(b.bookmarkedAt || 0);
        return oldestFirst ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');

    // Reset filter values
    categoryFilter.value = 'all';
    dateFilter.value = 'recent';

    // Apply filters with reset values
    applyFilters();
}

/**
 * Show toast notification
 * @param {string} message Message to display
 * @param {string} type Type of toast ('success' or 'error')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');

    // Set message and icon based on type
    toastMessage.textContent = message;

    if (type === 'error') {
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        toastIcon.className = 'toast-icon error';
    } else {
        toastIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        toastIcon.className = 'toast-icon';
    }

    // Show toast
    toast.classList.add('show');

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Update bookmark stats on the main page
 * @param {number} count Number of bookmarks
 */
function updateBookmarkStats(count) {
    // Try to update the bookmarks count on the main page if it exists
    try {
        const statElement = document.querySelector('.quick-stats .stat-number:nth-child(3)');
        if (statElement) {
            statElement.textContent = count;
        }
    } catch (error) {
        console.log('Stats element not found on this page');
    }
} 