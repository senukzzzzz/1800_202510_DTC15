/**
 * Simple bookmark utilities
 */
const bookmarkStore = {
    // Get bookmarks from localStorage
    getBookmarks: function () {
        const bookmarks = localStorage.getItem('bookmarks');
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    // Save an article to bookmarks
    saveBookmark: function (article) {
        const bookmarks = this.getBookmarks();

        // Check if already bookmarked
        if (!bookmarks.some(item => item.id === article.id)) {
            // Add timestamp and save
            article.bookmarkedAt = new Date().toISOString();
            bookmarks.push(article);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

            // Show simple notification
            this.showToast('Bookmarked!');
            return true;
        } else {
            // Already bookmarked - show message
            this.showToast('Already bookmarked');
            return false;
        }
    },

    // Remove a bookmark
    removeBookmark: function (articleId) {
        const bookmarks = this.getBookmarks();
        const filtered = bookmarks.filter(item => item.id !== articleId);

        if (bookmarks.length !== filtered.length) {
            localStorage.setItem('bookmarks', JSON.stringify(filtered));
            this.showToast('Removed from bookmarks');
            return true;
        }
        return false;
    },

    // Toggle bookmark (add if not exists, remove if exists)
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

    // Check if article is bookmarked
    isBookmarked: function (articleId) {
        return this.getBookmarks().some(item => item.id === articleId);
    },

    // Clear all bookmarks
    clearAll: function () {
        localStorage.removeItem('bookmarks');
        this.showToast('All bookmarks cleared');
    },

    // Simple toast notification
    showToast: function (message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = '#0072ff';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';

        document.body.appendChild(toast);

        // Animation
        setTimeout(() => toast.style.opacity = '1', 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}; 