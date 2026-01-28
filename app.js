// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global state
let allArticles = [];
let currentCategory = 'all';

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function getCategoryColor(category) {
    const colors = {
        'politik': '#000',
        'ekonomi': '#000',
        'teknologi': '#000',
        'olahraga': '#000',
        'internasional': '#000'
    };
    return colors[category.toLowerCase()] || '#000';
}

// Load Articles from Firebase
async function loadArticles() {
    try {
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        allArticles = [];
        querySnapshot.forEach((doc) => {
            allArticles.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (allArticles.length === 0) {
            // Load sample data if no articles exist
            loadSampleData();
        } else {
            renderHero();
            renderLatestNews();
            renderCategoryNews();
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        loadSampleData();
    }
}

// Sample Data (fallback when Firebase is not configured)
function loadSampleData() {
    allArticles = [
        {
            id: '1',
            title: 'Perkembangan Teknologi AI di Indonesia Mencapai Titik Tertinggi',
            excerpt: 'Industri teknologi kecerdasan buatan di Indonesia mengalami pertumbuhan signifikan dengan investasi mencapai triliunan rupiah.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
            category: 'Teknologi',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop',
            featured: true
        },
        {
            id: '2',
            title: 'Ekonomi Global Menghadapi Tantangan Inflasi',
            excerpt: 'Bank sentral di berbagai negara mengambil langkah strategis untuk mengatasi tekanan inflasi yang meningkat.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            category: 'Ekonomi',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop',
            featured: false
        },
        {
            id: '3',
            title: 'Kebijakan Pemerintah Baru dalam Sektor Pendidikan',
            excerpt: 'Pemerintah mengumumkan reformasi pendidikan komprehensif untuk meningkatkan kualitas pembelajaran di seluruh Indonesia.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            category: 'Politik',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop',
            featured: false
        },
        {
            id: '4',
            title: 'Tim Nasional Indonesia Raih Prestasi di Turnamen Internasional',
            excerpt: 'Prestasi membanggakan diraih tim nasional Indonesia dalam kompetisi olahraga tingkat Asia.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            category: 'Olahraga',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=800&fit=crop',
            featured: false
        },
        {
            id: '5',
            title: 'Inovasi Startup Indonesia Menarik Perhatian Investor Global',
            excerpt: 'Ekosistem startup Indonesia terus berkembang dengan beberapa unicorn baru bermunculan tahun ini.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            category: 'Teknologi',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&h=800&fit=crop',
            featured: false
        },
        {
            id: '6',
            title: 'Perubahan Iklim: Langkah Konkret yang Perlu Diambil',
            excerpt: 'Para ahli lingkungan mendesak tindakan segera untuk mengatasi dampak perubahan iklim yang semakin nyata.',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            category: 'Internasional',
            author: 'Admin',
            publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=1200&h=800&fit=crop',
            featured: false
        }
    ];

    renderHero();
    renderLatestNews();
    renderCategoryNews();
}

// Render Hero Section
function renderHero() {
    const heroContent = document.getElementById('heroContent');
    if (!heroContent || allArticles.length === 0) return;

    const featured = allArticles[0];
    const sideArticles = allArticles.slice(1, 4);

    heroContent.innerHTML = `
        <div class="hero-main" onclick="openArticle('${featured.id}')">
            <img src="${featured.imageUrl}" alt="${featured.title}" class="hero-image">
            <div class="hero-overlay">
                <span class="hero-category">${featured.category}</span>
                <h1 class="hero-title">${featured.title}</h1>
                <p class="hero-meta">Oleh ${featured.author} • ${formatDate(featured.publishedAt)}</p>
            </div>
        </div>
        <div class="hero-sidebar">
            ${sideArticles.map(article => `
                <div class="hero-small" onclick="openArticle('${article.id}')">
                    <img src="${article.imageUrl}" alt="${article.title}" class="hero-small-image">
                    <span class="hero-small-category">${article.category}</span>
                    <h3 class="hero-small-title">${truncateText(article.title, 80)}</h3>
                    <p class="hero-small-meta">${formatDate(article.publishedAt)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// Render Latest News
function renderLatestNews() {
    const latestNews = document.getElementById('latestNews');
    if (!latestNews) return;

    const articles = allArticles.slice(0, 6);

    latestNews.innerHTML = articles.map(article => `
        <div class="news-card" onclick="openArticle('${article.id}')">
            <img src="${article.imageUrl}" alt="${article.title}" class="news-image">
            <span class="news-category">${article.category}</span>
            <h3 class="news-title">${truncateText(article.title, 70)}</h3>
            <p class="news-excerpt">${truncateText(article.excerpt, 120)}</p>
            <p class="news-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
        </div>
    `).join('');
}

// Render Category News
function renderCategoryNews() {
    const categoryNews = document.getElementById('categoryNews');
    if (!categoryNews) return;

    let articles = allArticles;
    if (currentCategory !== 'all') {
        articles = allArticles.filter(a => 
            a.category.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    if (articles.length === 0) {
        categoryNews.innerHTML = `
            <div class="loading">
                <p>Belum ada artikel untuk kategori ini</p>
            </div>
        `;
        return;
    }

    categoryNews.innerHTML = articles.map(article => `
        <div class="news-item" onclick="openArticle('${article.id}')">
            <img src="${article.imageUrl}" alt="${article.title}" class="news-item-image">
            <div class="news-item-content">
                <span class="news-category">${article.category}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt}</p>
                <p class="news-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
            </div>
        </div>
    `).join('');
}

// Open Article Modal
window.openArticle = function(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;

    const modal = document.getElementById('articleModal');
    const articleDetail = document.getElementById('articleDetail');

    articleDetail.innerHTML = `
        <span class="article-category">${article.category}</span>
        <h1 class="article-title">${article.title}</h1>
        <p class="article-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
        <img src="${article.imageUrl}" alt="${article.title}" class="article-image">
        <div class="article-content">
            ${article.content.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Close Article Modal
function closeModal() {
    const modal = document.getElementById('articleModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Search Functionality
function toggleSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    
    if (searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
    } else {
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput.focus(), 100);
    }
}

// Category Filter
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderCategoryNews();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load articles
    loadArticles();

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchClose = document.getElementById('searchClose');
    const searchOverlay = document.getElementById('searchOverlay');

    searchBtn?.addEventListener('click', toggleSearch);
    searchClose?.addEventListener('click', toggleSearch);
    searchOverlay?.addEventListener('click', (e) => {
        if (e.target === searchOverlay) toggleSearch();
    });

    // Modal functionality
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');

    modalClose?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', closeModal);

    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterByCategory(category);
        });
    });

    // Escape key handlers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            const searchOverlay = document.getElementById('searchOverlay');
            if (searchOverlay?.classList.contains('active')) {
                toggleSearch();
            }
        }
    });
});
