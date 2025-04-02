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
                this.syncBookmarksToFirebase(article);
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
                this.removeBookmarkFromFirebase(id);
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
        try {
            const bookmarks = this.getBookmarks();
            const index = bookmarks.findIndex(b => b.id === article.id);
            
            if (index === -1) {
                // Add bookmark with timestamp
                article.bookmarkedAt = new Date().toISOString();
                bookmarks.push(article);
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                this.syncBookmarksToFirebase(article);
                this.showToast('Article bookmarked successfully');
                return { success: true, action: 'added' };
            } else {
                // Remove bookmark
                bookmarks.splice(index, 1);
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                this.removeBookmarkFromFirebase(article.id);
                this.showToast('Bookmark removed');
                return { success: true, action: 'removed' };
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            this.showToast('Failed to update bookmark', 'error');
            return { success: false, action: 'error' };
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
        const user = firebase.auth().currentUser;
        if (user) {
            this.clearFirebaseBookmarks();
        }
    },

    /**
     * Show toast notification
     * @param {string} message Message to display
     * @param {string} type Type of notification
     */
    showToast: function (message, type = 'success') {
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

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    async syncBookmarksToFirebase(article) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const userBookmarksRef = db.collection('Users').doc(user.uid).collection('bookmarks');
            
            const bookmarkData = {
                id: article.id,
                title: article.title,
                description: article.description || '',
                url: article.url,
                urlToImage: article.urlToImage || '',
                publishedAt: article.publishedAt,
                category: article.category || 'general',
                bookmarkedAt: article.bookmarkedAt || new Date().toISOString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await userBookmarksRef.doc(article.id).set(bookmarkData);
            console.log('Bookmark synced to Firebase');
        } catch (error) {
            console.error('Error syncing bookmark to Firebase:', error);
        }
    },

    async removeBookmarkFromFirebase(articleId) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const userBookmarksRef = db.collection('Users').doc(user.uid).collection('bookmarks');
            await userBookmarksRef.doc(articleId).delete();
            console.log('Bookmark removed from Firebase');
        } catch (error) {
            console.error('Error removing bookmark from Firebase:', error);
        }
    },

    async clearFirebaseBookmarks() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const userBookmarksRef = db.collection('Users').doc(user.uid).collection('bookmarks');
            const snapshot = await userBookmarksRef.get();
            
            // Delete all bookmarks in Firebase
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            console.log('All bookmarks cleared from Firebase');
        } catch (error) {
            console.error('Error clearing Firebase bookmarks:', error);
        }
    },

    async loadBookmarksFromFirebase() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const userBookmarksRef = db.collection('Users').doc(user.uid).collection('bookmarks');
            const snapshot = await userBookmarksRef.get();
            
            if (snapshot.empty) {
                // If Firebase is empty, sync localStorage bookmarks to Firebase
                const localBookmarks = this.getBookmarks();
                for (const bookmark of localBookmarks) {
                    await this.syncBookmarksToFirebase(bookmark);
                }
            } else {
                // Use Firebase as source of truth
                const firebaseBookmarks = [];
                snapshot.forEach(doc => {
                    const bookmarkData = doc.data();
                    firebaseBookmarks.push(bookmarkData);
                });
                
                // Sort by bookmarked date
                firebaseBookmarks.sort((a, b) => {
                    return new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt);
                });
                
                // Update localStorage with Firebase data
                localStorage.setItem('bookmarks', JSON.stringify(firebaseBookmarks));
            }
            
            console.log('Bookmarks synchronized with Firebase');
        } catch (error) {
            console.error('Error loading bookmarks from Firebase:', error);
        }
    }
};

// Initialize bookmarks synchronization when user logs in
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            bookmarkStore.loadBookmarksFromFirebase();
        } else {
            // Clear localStorage bookmarks when user logs out
            localStorage.removeItem('bookmarks');
        }
    });
}); 