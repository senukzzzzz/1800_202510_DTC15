/**
 * Bookmark Utilities
 * Provides functions for managing bookmarks in localStorage
 */
const bookmarkStore = {
    /**
     * Get all bookmarks from localStorage
     * @returns {Array} Array of bookmark objects
     */
    getBookmarks: function () {
        try {
            const bookmarks = localStorage.getItem('bookmarks');
            return bookmarks ? JSON.parse(bookmarks) : [];
        } catch (error) {
            console.error('Error getting bookmarks:', error);
            return [];
        }
    },

    /**
     * Save a bookmark
     * @param {Object} article Article object to save
     * @returns {boolean} Success status
     */
    saveBookmark: function (article) {
        try {
            const bookmarks = this.getBookmarks();

            // Check if already bookmarked
            if (!bookmarks.some(item => item.id === article.id)) {
                // Add timestamp and save
                article.bookmarkedAt = new Date().toISOString();
                bookmarks.push(article);
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                this.showToast('Article bookmarked successfully');
                return true;
            } else {
                this.showToast('Already bookmarked', 'info');
                return false;
            }
        } catch (error) {
            console.error('Error saving bookmark:', error);
            this.showToast('Failed to bookmark article', 'error');
            return false;
        }
    },

    /**
     * Remove a bookmark
     * @param {string} id ID of the bookmark to remove
     * @returns {boolean} Success status
     */
    removeBookmark: function (id) {
        try {
            const bookmarks = this.getBookmarks();
            const filtered = bookmarks.filter(item => item.id !== id);

            if (bookmarks.length !== filtered.length) {
                localStorage.setItem('bookmarks', JSON.stringify(filtered));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing bookmark:', error);
            return false;
        }
    },

    /**
     * Toggle bookmark status (add if not exists, remove if exists)
     * @param {Object} article Article object to toggle
     * @returns {Object} Result with action and success status
     */
    toggleBookmark: function (article) {
        if (this.isBookmarked(article.id)) {
            return {
                action: 'removed',
                success: this.removeBookmark(article.id)
            };
        } else {
            return {
                action: 'added',
                success: this.saveBookmark(article)
            };
        }
    },

    /**
     * Check if an article is bookmarked
     * @param {string} id ID of the article to check
     * @returns {boolean} Whether the article is bookmarked
     */
    isBookmarked: function (id) {
        return this.getBookmarks().some(item => item.id === id);
    },

    /**
     * Clear all bookmarks
     */
    clearAll: function () {
        localStorage.removeItem('bookmarks');
    },

    /**
     * Show toast notification
     * This is a simplified version that can be used by other pages
     * @param {string} message Message to display
     * @param {string} type Type of notification
     */
    showToast: function (message, type = 'success') {
        // Create a simple toast if it doesn't exist
        let toast = document.getElementById('toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';

            const icon = document.createElement('div');
            icon.className = 'toast-icon';
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';

            const messageEl = document.createElement('div');
            messageEl.className = 'toast-message';

            toast.appendChild(icon);
            toast.appendChild(messageEl);
            document.body.appendChild(toast);
        }

        // Set message and icon based on type
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');

        toastMessage.textContent = message;

        if (type === 'error') {
            toastIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            toastIcon.className = 'toast-icon error';
        } else if (type === 'info') {
            toastIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
            toastIcon.className = 'toast-icon info';
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
}; 