/**
 * Bookmarks Page JavaScript
 * Handles all interactive functionality for the bookmarks page including:
 * - Loading and displaying bookmarks
 * - Mobile menu toggle
 * - Modal confirmation
 * - Bookmark management and filtering
 * 
 * Modern implementation with ES6+ features and improved UX
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize page
    loadBookmarks();
    setupBookmarkActions();
    setupMobileMenu();
});

/**
 * Load and display bookmarked articles
 */
const loadBookmarks = () => {
    const bookmarksList = document.getElementById('bookmarksList');
    if (!bookmarksList) return;

    // Clear current content
    bookmarksList.innerHTML = '';

    // Get bookmarks
    const bookmarks = bookmarkStore.getBookmarks();

    // Check if empty
    if (bookmarks.length === 0) {
        showEmptyState(bookmarksList);
        return;
    }

    // Sort by date (newest first)
    bookmarks.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));

    // Create bookmark items
    bookmarks.forEach((bookmark, index) => {
        const item = createBookmarkItem(bookmark);
        bookmarksList.appendChild(item);

        // Fade in with delay
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 50 * index);
    });

    // Update category filter options
    updateCategoryFilter();
};

/**
 * Create a bookmark item element
 * @param {Object} bookmark - The bookmark data
 * @returns {HTMLElement} The bookmark item element
 */
const createBookmarkItem = (bookmark) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.id = bookmark.id;
    item.dataset.category = bookmark.category.toLowerCase();

    // Animation setup
    item.style.opacity = '0';
    item.style.transform = 'translateY(15px)';
    item.style.transition = 'all 0.3s ease';

    // Calculate time ago
    const timeAgo = getTimeAgo(bookmark.bookmarkedAt);

    item.innerHTML = `
        <div class="bookmark-image">
            <img src="${bookmark.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                alt="${bookmark.title}">
            <span class="bookmark-category">${bookmark.category}</span>
        </div>
        <div class="bookmark-content">
            <h3>${bookmark.title}</h3>
            <p>${bookmark.description}</p>
            <div class="bookmark-meta">
                <span class="bookmark-date">Saved ${timeAgo}</span>
                <div class="bookmark-actions">
                    <button class="action-btn read-btn">
                        <i class="fas fa-book-open"></i>
                        Read
                    </button>
                    <button class="action-btn remove-btn">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;

    return item;
};

/**
 * Simple time ago function (e.g. "2 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time text
 */
const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
};

/**
 * Show empty state when no bookmarks exist
 * @param {HTMLElement} container - The container element to show the empty state
 */
const showEmptyState = (container) => {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
        <div class="empty-icon">
            <i class="far fa-bookmark"></i>
        </div>
        <h3>No bookmarks yet</h3>
        <p>Articles you bookmark will appear here</p>
        <a href="main.html" class="browse-btn">
            <i class="fas fa-newspaper"></i>
            Browse Articles
        </a>
    `;
    container.appendChild(empty);
};

/**
 * Set up actions for bookmark items (remove, read, etc.)
 */
const setupBookmarkActions = () => {
    const bookmarksList = document.getElementById('bookmarksList');
    if (!bookmarksList) return;

    // Remove button action
    bookmarksList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const item = removeBtn.closest('.bookmark-item');
            const id = item.dataset.id;

            // Animate removal
            item.style.opacity = '0';
            item.style.transform = 'translateX(50px)';

            // Remove from storage and DOM
            setTimeout(() => {
                bookmarkStore.removeBookmark(id);
                item.remove();

                // Show empty state if no bookmarks left
                if (bookmarksList.children.length === 0) {
                    showEmptyState(bookmarksList);
                }
            }, 300);
        }

        // Read button animation
        const readBtn = e.target.closest('.read-btn');
        if (readBtn) {
            const item = readBtn.closest('.bookmark-item');
            item.classList.add('reading');
            setTimeout(() => item.classList.remove('reading'), 500);
        }
    });

    // Clear all bookmarks
    const clearBtn = document.getElementById('clearBookmarks');
    const confirmModal = document.getElementById('confirmModal');

    if (clearBtn && confirmModal) {
        clearBtn.addEventListener('click', () => {
            confirmModal.classList.add('show');
        });

        // Cancel button
        const cancelBtn = document.getElementById('cancelDelete');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }

        // Confirm delete all
        const confirmBtn = document.getElementById('confirmDelete');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                // Clear storage
                bookmarkStore.clearAll();

                // Clear display with animation
                const items = document.querySelectorAll('.bookmark-item');
                items.forEach(item => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                });

                setTimeout(() => {
                    bookmarksList.innerHTML = '';
                    showEmptyState(bookmarksList);
                    confirmModal.classList.remove('show');
                }, 300);
            });
        }

        // Close button
        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }
    }

    // Setup filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (categoryFilter && dateFilter) {
        const applyFilters = () => {
            const category = categoryFilter.value;
            const dateSort = dateFilter.value;
            const items = Array.from(document.querySelectorAll('.bookmark-item'));

            // Filter by category
            items.forEach(item => {
                const isVisible = category === 'all' ||
                    item.dataset.category.toLowerCase() === category.toLowerCase();

                item.style.display = isVisible ? 'flex' : 'none';
            });

            // Check if any visible items
            const visibleItems = items.filter(item => item.style.display !== 'none');

            if (visibleItems.length === 0) {
                // Show message if no matches
                if (!document.getElementById('filterEmptyMessage')) {
                    const message = document.createElement('div');
                    message.id = 'filterEmptyMessage';
                    message.className = 'empty-state filter-empty-state';
                    message.innerHTML = `
                        <div class="empty-icon">
                            <i class="fas fa-filter"></i>
                        </div>
                        <h3>No matching bookmarks</h3>
                        <p>Try a different category filter</p>
                        <button class="browse-btn reset-filters-btn">
                            <i class="fas fa-undo"></i>
                            Reset Filters
                        </button>
                    `;
                    bookmarksList.appendChild(message);

                    // Reset filters button
                    message.querySelector('.reset-filters-btn').addEventListener('click', () => {
                        categoryFilter.value = 'all';
                        dateFilter.value = 'recent';
                        applyFilters();
                    });
                }
            } else {
                // Remove message if matches found
                const message = document.getElementById('filterEmptyMessage');
                if (message) message.remove();
            }
        };

        categoryFilter.addEventListener('change', applyFilters);
        dateFilter.addEventListener('change', applyFilters);
    }
};

/**
 * Update category filter with available categories
 */
const updateCategoryFilter = () => {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;

    const bookmarks = bookmarkStore.getBookmarks();
    if (bookmarks.length === 0) return;

    // Get unique categories
    const categories = [...new Set(bookmarks.map(b =>
        b.category.toLowerCase()
    ))].sort();

    // Build options
    let options = `<option value="all">All Categories</option>`;
    categories.forEach(cat => {
        // Capitalize
        const display = cat.charAt(0).toUpperCase() + cat.slice(1);
        options += `<option value="${cat}">${display}</option>`;
    });

    filter.innerHTML = options;
};

/**
 * Sets up mobile menu functionality with smooth animations
 */
const setupMobileMenu = () => {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            if (menu.style.display === 'block') {
                menu.style.opacity = '0';
                setTimeout(() => menu.style.display = 'none', 300);
            } else {
                menu.style.display = 'block';
                setTimeout(() => menu.style.opacity = '1', 10);
            }
        });
    }
}; 