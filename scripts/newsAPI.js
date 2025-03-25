const apiKey = '9cf19d81beff4313aebdc0edf804f449';
let isLoading = false;
let currentPage = 1;
let categories = [];
let articlePool = {};
let categoriesListener = null;

async function getUserCategories() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            return ["general"];
        }

        const doc = await db.collection("Users").doc(user.uid).get();
        if (doc.exists && doc.data().categories && doc.data().categories.length > 0) {
            // Filter out any invalid categories
            const validCategories = doc.data().categories.filter(cat =>
                ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'].includes(cat.toLowerCase())
            );
            return validCategories.length > 0 ? validCategories : ["general"];
        }
        return ["general"];
    } catch (error) {
        console.error("Error getting user categories:", error);
        return ["general"];
    }
}

async function fetchArticlesForCategory(category, page = 1) {
    try {
        const url = new URL('https://newsapi.org/v2/top-headlines');
        const params = {
            apiKey: apiKey,
            country: 'us',
            category: category,
            pageSize: '50',        // Changed to 50 articles per category
            page: page.toString()
        };
        
        url.search = new URLSearchParams(params).toString();
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === "ok") {
            console.log(`Fetched ${data.articles.length} articles for ${category}. Total results: ${data.totalResults}`);
            return {
                articles: data.articles || [],
                totalResults: data.totalResults || 0
            };
        }
        return { articles: [], totalResults: 0 };
    } catch (error) {
        console.error(`Error fetching articles for ${category}:`, error);
        return { articles: [], totalResults: 0 };
    }
}

async function initializeArticlePool() {
    articlePool = {};
    
    // Fetch first page of articles for each category
    const fetchPromises = categories.map(async category => {
        const result = await fetchArticlesForCategory(category, 1);
        articlePool[category] = {
            articles: shuffleArray([...result.articles]),
            totalResults: result.totalResults,
            currentPage: 1
        };
    });
    
    await Promise.all(fetchPromises);
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function searchEvents() {
    try {
        categories = await getUserCategories();
        currentPage = 1;
        const newsFeed = document.querySelector('.news-feed');
        if (!newsFeed) return;

        newsFeed.innerHTML = ''; // Clear existing content

        // Get featured article from first category
        const featuredResponse = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${categories[0]}&pageSize=1&apiKey=${apiKey}`);
        const featuredData = await featuredResponse.json();

        if (featuredData.status === "ok" && featuredData.articles?.[0]) {
            const featuredArticle = createFeaturedArticle(featuredData.articles[0], categories[0]);
            newsFeed.appendChild(featuredArticle);
        }

        // Create container for infinite scroll content
        const infiniteScrollContainer = document.createElement('div');
        infiniteScrollContainer.className = 'infinite-scroll-container';
        newsFeed.appendChild(infiniteScrollContainer);

        // Load initial set of articles
        await loadMoreArticles(infiniteScrollContainer);

        // Set up intersection observer for infinite scroll
        setupInfiniteScroll(infiniteScrollContainer);

        // Keep scroll event as fallback
        window.addEventListener('scroll', handleScroll);

    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

function handleScroll() {
    const infiniteScrollContainer = document.querySelector('.infinite-scroll-container');
    if (!infiniteScrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    // Load earlier - when we're within 300px of the bottom
    // This gives more time for content to load before the user reaches the bottom
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoading) {
        loadMoreArticles(infiniteScrollContainer);
    }
}

async function loadMoreArticles(container) {
    if (isLoading) return;
    
    try {
        isLoading = true;

        // Add loading indicator with fade in
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading more stories...</p>
        `;
        container.appendChild(loadingIndicator);

        // Prepare the grid in advance but don't add to DOM yet
        await new Promise(resolve => setTimeout(resolve, 800));

        // Create grid for this row
        const newsGrid = document.createElement('div');
        newsGrid.className = 'news-grid';

        // Optimize the loading delay - keep it short but noticeable
        await new Promise(resolve => setTimeout(resolve, 600));

        // Get articles from all categories
        const articlePromises = categories.map(category =>
            fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=4&page=${currentPage}&apiKey=${apiKey}`)
                .then(res => res.json())
        );

        const results = await Promise.all(articlePromises);

        // Collect all articles with their categories
        let allArticles = [];
        results.forEach((result, index) => {
            if (result.status === "ok" && result.articles) {
                result.articles.forEach(article => {
                    allArticles.push({
                        article,
                        category: categories[index]
                    });
                });
            }
        });

        // Shuffle articles for diversity
        allArticles = shuffleArray(allArticles);

        // Get exactly 3 articles or fetch more if needed
        if (allArticles.length < 3) {
            currentPage++;
            const moreArticlePromises = categories.map(category =>
                fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=6&page=${currentPage}&apiKey=${apiKey}`)
                    .then(res => res.json())
            );

            const moreResults = await Promise.all(moreArticlePromises);

            moreResults.forEach((result, index) => {
                if (result.status === "ok" && result.articles) {
                    result.articles.forEach(article => {
                        allArticles.push({
                            article,
                            category: categories[index]
                        });
                    });
                }
            });

            allArticles = shuffleArray(allArticles);
        }

        // Select exactly 3 articles
        const selectedArticles = allArticles.slice(0, 3);

        // Preload all images before showing the articles
        const imagePreloadPromises = selectedArticles.map(({ article }) => {
            return new Promise((resolve) => {
                if (!article.urlToImage) {
                    resolve(); // No image to preload
                    return;
                }

                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = article.urlToImage;
            });
        });

        // Wait for images to preload (with a timeout to prevent hanging)
        await Promise.race([
            Promise.all(imagePreloadPromises),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        // Only now remove the loading indicator
        loadingIndicator.style.opacity = '0';
        loadingIndicator.style.transform = 'translateY(-10px)';

        // Wait for fade out animation
        await new Promise(resolve => setTimeout(resolve, 200));
        loadingIndicator.remove();

        // Add articles to the grid
        if (selectedArticles.length === 3) {
            selectedArticles.forEach(({ article, category }) => {
                const articleCard = createArticleCard(article, category);
                newsGrid.appendChild(articleCard);
            });
        } else if (selectedArticles.length > 0) {
            // If we still couldn't get 3 articles, use what we have but maintain 3-column grid
            selectedArticles.forEach(({ article, category }) => {
        // Get available categories that still have articles
        let availableCategories = categories.filter(cat => articlePool[cat]?.articles.length > 0);
        
        // If running low on articles, fetch more for categories that have more pages
        for (const category of categories) {
            const pool = articlePool[category];
            // Changed threshold to fetch more when less than 5 articles remain
            if (pool.articles.length < 5 && pool.totalResults > (pool.currentPage * 50)) {
                pool.currentPage++;
                const newResult = await fetchArticlesForCategory(category, pool.currentPage);
                pool.articles = [...pool.articles, ...shuffleArray(newResult.articles)];
            }
        }

        // Refresh available categories after potential fetches
        availableCategories = categories.filter(cat => articlePool[cat]?.articles.length > 0);

        // Select 3 random articles from different categories when possible
        const selectedArticles = [];
        const usedCategories = new Set();

        while (selectedArticles.length < 3 && availableCategories.length > 0) {
            // Prioritize unused categories for this row
            let availableCatsForThis = availableCategories.filter(cat => !usedCategories.has(cat));
            
            // If all categories have been used, allow reuse
            if (availableCatsForThis.length === 0) {
                availableCatsForThis = availableCategories;
            }

            const randomCategoryIndex = Math.floor(Math.random() * availableCatsForThis.length);
            const category = availableCatsForThis[randomCategoryIndex];
            
            if (articlePool[category].articles.length > 0) {
                const article = articlePool[category].articles.shift();
                selectedArticles.push({ article, category });
                usedCategories.add(category);
            } else {
                availableCategories = availableCategories.filter(cat => cat !== category);
            }
        }

        // Remove loading indicator
        loadingIndicator.remove();

        if (selectedArticles.length > 0) {
            // Shuffle the selected articles before displaying
            shuffleArray(selectedArticles).forEach(({article, category}) => {
                const articleCard = createArticleCard(article, category);
                newsGrid.appendChild(articleCard);
            });

            // Add empty placeholders for missing articles to maintain grid
            for (let i = selectedArticles.length; i < 3; i++) {
                const placeholderCard = document.createElement('div');
                placeholderCard.className = 'news-card placeholder';
                placeholderCard.style.visibility = 'hidden';
                newsGrid.appendChild(placeholderCard);
            }
        }

        // Add the grid to container
        container.appendChild(newsGrid);
        currentPage++;
        return true;
            container.appendChild(newsGrid);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error loading more articles:", error);
        return false;
    } finally {
        // Small delay before setting isLoading to false to prevent double-loading
        setTimeout(() => {
            isLoading = false;
        }, 300);
    }
}

function displayArticles(grid, articles, category) {
    grid.innerHTML = ''; // Clear current articles
    articles.forEach(article => {
        const articleCard = createArticleCard(article, category);
        grid.appendChild(articleCard);
    });
}

/**
 * Create an article card element - Fixed for mobile display
 * @param {Object} article The article data from the API
 * @param {string} category The category this article belongs to
 * @returns {HTMLElement} The article card DOM element
 */
function createArticleCard(article, category) {
    // Create a unique ID for the article if it doesn't have one
    if (!article.id) {
        article.id = generateArticleId(article);
    }

    // Set category if provided from parameter
    if (category && !article.category) {
        article.category = category;
    }

    const card = document.createElement('div');
    card.className = 'news-card';
    card.dataset.id = article.id;

    // Format the time (relying on the publishedAt property from the API)
    const formattedTime = formatTime(article.publishedAt);

    // Use placeholder image if none is provided by the API
    const imageUrl = article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image';

    // Check if article is already bookmarked
    const isBookmarked = bookmarkStore.isBookmarked(article.id);
    const bookmarkClass = isBookmarked ? 'bookmark-btn active' : 'bookmark-btn';

    // Important: Keep this structure with image div as the first child for proper mobile display
    card.innerHTML = `
        <div class="news-image">
            <img src="${imageUrl}" alt="${article.title}" loading="lazy">
            <div class="category-tag">${article.category || category || 'General'}</div>
        </div>
        <div class="news-content">
            <h3>${article.title}</h3>
            <p>${article.description || 'No description available.'}</p>
            <div class="news-meta">
                <span class="time"><i class="far fa-clock"></i> ${formattedTime}</span>
                <div class="actions">
                    <button class="read-btn" data-url="${article.url}" aria-label="Read article">
                        <i class="fas fa-book-open"></i>
                        <span class="btn-text">Read</span>
                    </button>
                    <button class="${bookmarkClass}" data-id="${article.id}" aria-label="${isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}">
                        <i class="fas fa-bookmark"></i>
                        <span class="btn-text">Save</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', function () {
        toggleBookmark(article, this);
    });

    const readBtn = card.querySelector('.read-btn');
    readBtn.addEventListener('click', function () {
        openArticle(article.url, card);
    });

    return card;
}

/**
 * Create featured article element - Fixed for mobile display
 * @param {Object} article The article data from the API
 * @param {string} category The category this article belongs to
 * @returns {HTMLElement} The featured article card DOM element
 */
function createFeaturedArticle(article, category) {
    // Create a unique ID for the article if it doesn't have one
    if (!article.id) {
        article.id = generateArticleId(article);
    }

    // Set category if provided from parameter
    if (category && !article.category) {
        article.category = category;
    }

    const card = document.createElement('div');
    card.className = 'news-card featured';
    card.dataset.id = article.id;

    // Format the time
    const formattedTime = formatTime(article.publishedAt);

    // Use placeholder image if none is provided
    const imageUrl = article.urlToImage || 'https://via.placeholder.com/800x400?text=No+Image';

    // Check if article is already bookmarked
    const isBookmarked = bookmarkStore.isBookmarked(article.id);
    const bookmarkClass = isBookmarked ? 'bookmark-btn active' : 'bookmark-btn';

    // Important: Keep this structure with image div as the first child for proper mobile display
    card.innerHTML = `
        <div class="news-image">
            <img src="${imageUrl}" alt="${article.title}" loading="eager">
            <div class="category-tag">${article.category || category || 'General'}</div>
        </div>
        <div class="news-content">
            <h2 class="featured-title">${article.title}</h2>
            <p>${article.description || 'No description available.'}</p>
            <div class="news-meta">
                <span class="time"><i class="far fa-clock"></i> ${formattedTime}</span>
                <div class="actions">
                    <button class="read-btn" data-url="${article.url}" aria-label="Read article">
                        <i class="fas fa-book-open"></i>
                        <span class="btn-text">Read</span>
                    </button>
                    <button class="${bookmarkClass}" data-id="${article.id}" aria-label="${isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}">
                        <i class="fas fa-bookmark"></i>
                        <span class="btn-text">Save</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', function () {
        toggleBookmark(article, this);
    });

    const readBtn = card.querySelector('.read-btn');
    readBtn.addEventListener('click', function () {
        openArticle(article.url, card);
    });

    return card;
}

// Add styles for the new layout
const gridStyles = document.createElement('style');
gridStyles.textContent = `
    .category-section {
        margin: 2rem 0;
    }

    .category-section-header {
        margin: 1rem;
        color: var(--text-color);
        font-size: 1.5rem;
        font-weight: 600;
    }

    .grid-container {
        position: relative;
        padding: 0 1rem;
    }

    .news-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        transition: all 0.3s ease;
    }

    .next-button {
        position: absolute;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--nav-bg);
        border: 1px solid var(--card-border);
        color: var(--text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .next-button:hover {
        background: var(--accent-color);
        color: white;
        transform: translateY(-50%) scale(1.1);
    }

    @media (max-width: 768px) {
        .news-grid {
            grid-template-columns: 1fr;
        }

        .next-button {
            width: 32px;
            height: 32px;
        }
    }
`;
document.head.appendChild(gridStyles);

// Add styles for infinite scroll
const scrollStyles = document.createElement('style');
scrollStyles.textContent = `
    .infinite-scroll-container {
        margin-top: 2rem;
    }

    .news-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
        opacity: 1;
        transition: opacity 0.3s ease;
    }

    @media (max-width: 768px) {
        .news-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(scrollStyles);

// Add these styles
const cardStyles = document.createElement('style');
cardStyles.textContent = `
    .news-card {
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .category-tag {
        position: absolute;
        top: 1rem;
        left: 1rem;
        display: inline-block;
        padding: 0.4rem 0.8rem;
        background: var(--accent-color);
        color: white;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: capitalize;
        z-index: 1;
        width: auto;
    }

    .news-card .article-image {
        margin-top: auto;
        width: 100%;
        max-height: 200px;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .news-card .article-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .news-card:hover .article-image img {
        transform: scale(1.05);
    }

    .news-card h3 {
        margin-top: 2.5rem;
        margin-bottom: 0.5rem;
    }

    .news-card p {
        margin-bottom: 1rem;
    }

    .news-meta {
        margin-top: auto;
    }

    /* Featured article specific styles */
    .news-card.featured .category-tag {
        position: static;
        display: inline-block;
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(cardStyles);

// Add these styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        width: 100%;
        gap: 1rem;
    }

    .loading-indicator p {
        color: var(--text-color-secondary);
        font-size: 0.9rem;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--card-border);
        border-top: 3px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .news-grid {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeIn 0.5s ease forwards;
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(loadingStyles);

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Set up Firestore listener for category changes
            categoriesListener = db.collection("Users").doc(user.uid)
                .onSnapshot(() => {
                    // Remove existing scroll listener before reinitializing
                    window.removeEventListener('scroll', handleScroll);
                    searchEvents();
                });
        } else {
            if (categoriesListener) {
                categoriesListener();
                categoriesListener = null;
            }
            // Remove existing scroll listener before reinitializing
            window.removeEventListener('scroll', handleScroll);
            searchEvents();
        }
    });
});

export { searchEvents };

/**
 * Open article in a new tab with animation
 * @param {string} url The article URL to open
 * @param {HTMLElement} card The card element for animation
 */
function openArticle(url, card) {
    // Add reading animation class
    card.classList.add('reading');

    // Open article in new tab after slight delay for animation
    setTimeout(() => {
        window.open(url, '_blank');
        // Remove animation class
        card.classList.remove('reading');
    }, 300);
}

/**
 * Toggle bookmark status of an article
 * @param {Object} article The article object to bookmark
 * @param {HTMLElement} button The bookmark button element
 */
function toggleBookmark(article, button) {
    const result = bookmarkStore.toggleBookmark(article);

    if (result.success) {
        // Update button state based on the result
        if (result.action === 'added') {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }

        // Update bookmark stats if available
        updateBookmarkStats();
    }
}

/**
 * Update bookmark count in the stats section
 */
function updateBookmarkStats() {
    const bookmarks = bookmarkStore.getBookmarks();
    const statElement = document.querySelector('.quick-stats .stat-number:nth-child(3)');

    if (statElement) {
        statElement.textContent = bookmarks.length;
    }
}

/**
 * Generate a unique ID for an article
 * @param {Object} article The article object
 * @returns {string} A unique ID
 */
function generateArticleId(article) {
    // Create a simple hash from the title
    return article.title
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '')
        .toLowerCase()
        .substring(0, 50) + '-' + Date.now().toString(36);
}

/**
 * Format published time to a readable format
 * @param {string} dateString ISO date string from the API
 * @returns {string} Formatted time string
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
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
 * Initialize the news page functionality
 * Called when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function () {
    // Set up UI elements and event listeners
    setupMobileMenu();
    setupProfileDropdown();

    // Initialize bookmark stats
    updateBookmarkStats();

    // Load news content
    loadNews();
});

// Add after searchEvents function
function setupInfiniteScroll(container) {
    // Create a sentinel element that will trigger loading more content
    const sentinel = document.createElement('div');
    sentinel.className = 'load-sentinel';
    sentinel.style.height = '10px';
    sentinel.style.width = '100%';
    sentinel.style.visibility = 'hidden';
    container.appendChild(sentinel);

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMoreArticles(container);

                // Move the sentinel to the end after loading
                setTimeout(() => {
                    container.appendChild(sentinel);
                }, 1000);
            }
        });
    }, {
        rootMargin: '200px 0px', // Start loading before the sentinel is visible
    });

    // Start observing
    observer.observe(sentinel);

    return observer;
} 