const apiKey = '3c3dfd57b70c40c4a826e3e66a49a4d7';
let isLoading = false;
let currentPage = 1;
let categories = [];
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

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);

    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

function handleScroll() {
    const infiniteScrollContainer = document.querySelector('.infinite-scroll-container');
    if (!infiniteScrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // If we're near the bottom (within 100px)
    if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading) {
        loadMoreArticles(infiniteScrollContainer);
    }
}

async function loadMoreArticles(container) {
    if (isLoading) return;
    
    try {
        isLoading = true;

        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading more stories...</p>
        `;
        container.appendChild(loadingIndicator);

        // Artificial delay for better UX (remove if not wanted)
        await new Promise(resolve => setTimeout(resolve, 800));

        // Create grid for this row
        const newsGrid = document.createElement('div');
        newsGrid.className = 'news-grid';

        // Get articles from all categories
        const articlePromises = categories.map(category => 
            fetch(`https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=3&page=${currentPage}&apiKey=${apiKey}`)
                .then(res => res.json())
        );

        const results = await Promise.all(articlePromises);
        
        // Remove loading indicator
        loadingIndicator.remove();

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

        // Randomly select 3 articles for this row
        const selectedArticles = [];
        while (selectedArticles.length < 3 && allArticles.length > 0) {
            const randomIndex = Math.floor(Math.random() * allArticles.length);
            selectedArticles.push(allArticles.splice(randomIndex, 1)[0]);
        }

        if (selectedArticles.length > 0) {
            selectedArticles.forEach(({article, category}) => {
                const articleCard = createArticleCard(article, category);
                newsGrid.appendChild(articleCard);
            });

            container.appendChild(newsGrid);
            currentPage++;
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error loading more articles:", error);
        return false;
    } finally {
        isLoading = false;
    }
}

function displayArticles(grid, articles, category) {
    grid.innerHTML = ''; // Clear current articles
    articles.forEach(article => {
        const articleCard = createArticleCard(article, category);
        grid.appendChild(articleCard);
    });
}

function createFeaturedArticle(article, category) {
    const featuredArticle = document.createElement('article');
    featuredArticle.className = 'news-card featured';
    
    featuredArticle.innerHTML = `
        <div class="news-content">
            <span class="category-tag">${category}</span>
            <h2>${article.title}</h2>
            <p>${article.description || 'No description available...'}</p>
            <div class="news-meta">
                <span class="time">${new Date(article.publishedAt).toLocaleString()}</span>
                <div class="actions">
                    <button class="bookmark-btn">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                    </button>
                    <button class="share-btn">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <div class="news-image">
            <img src="${article.urlToImage || 'https://via.placeholder.com/800x600'}" alt="${article.title}">
        </div>
    `;
    
    return featuredArticle;
}

function createArticleCard(article, category) {
    const articleCard = document.createElement('article');
    articleCard.className = 'news-card';
    
    // Calculate if we need to show the image based on content length
    const title = article.title || '';
    const description = article.description || 'No description available...';
    const hasShortContent = (title.length + description.length) < 200; // Adjust this threshold as needed
    
    articleCard.innerHTML = `
        <span class="category-tag">${category}</span>
        <h3>${title}</h3>
        <p>${description}</p>
        ${hasShortContent && article.urlToImage ? `
            <div class="article-image">
                <img src="${article.urlToImage}" alt="${title}" onerror="this.style.display='none'">
            </div>
        ` : ''}
        <div class="news-meta">
            <span class="time">${new Date(article.publishedAt).toLocaleString()}</span>
            <div class="actions">
                <button class="bookmark-btn">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                </button>
                <button class="share-btn">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                    </svg>
                </button>
            </div>
        </div>
    `;

    return articleCard;
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