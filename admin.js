// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
let currentDeleteId = null;

// Utility Functions
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// View Switching
window.switchView = function(viewName) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update active view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
};

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

        updateDashboard();
        renderArticlesTable();
        renderArticlesGrid();
    } catch (error) {
        console.error('Error loading articles:', error);
        // If Firebase is not configured, continue with empty state
        allArticles = [];
        updateDashboard();
        renderArticlesTable();
        renderArticlesGrid();
    }
}

// Update Dashboard Stats
function updateDashboard() {
    const totalArticles = document.getElementById('totalArticles');
    const todayArticles = document.getElementById('todayArticles');
    
    if (totalArticles) {
        totalArticles.textContent = allArticles.length;
    }
    
    if (todayArticles) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = allArticles.filter(article => {
            const articleDate = article.publishedAt.toDate ? 
                article.publishedAt.toDate() : 
                new Date(article.publishedAt);
            articleDate.setHours(0, 0, 0, 0);
            return articleDate.getTime() === today.getTime();
        }).length;
        
        todayArticles.textContent = todayCount;
    }
}

// Render Dashboard Articles Table
function renderArticlesTable() {
    const container = document.getElementById('dashboardArticles');
    if (!container) return;

    if (allArticles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Belum Ada Artikel</h3>
                <p>Mulai dengan membuat artikel pertama Anda</p>
            </div>
        `;
        return;
    }

    const recentArticles = allArticles.slice(0, 5);

    container.innerHTML = recentArticles.map(article => `
        <div class="article-row">
            <img src="${article.imageUrl}" alt="${article.title}" class="article-thumbnail">
            <div class="article-info">
                <div class="article-title-text">${article.title}</div>
                <div class="article-excerpt-text">${article.excerpt}</div>
            </div>
            <span class="article-category-badge">${article.category}</span>
            <span class="article-date">${formatDate(article.publishedAt)}</span>
            <div class="article-actions">
                <button class="action-btn delete" onclick="confirmDelete('${article.id}')">Hapus</button>
            </div>
        </div>
    `).join('');
}

// Render Articles Grid
function renderArticlesGrid() {
    const container = document.getElementById('articlesGrid');
    if (!container) return;

    if (allArticles.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>Belum Ada Artikel</h3>
                <p>Mulai dengan membuat artikel pertama Anda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allArticles.map(article => `
        <div class="article-card">
            <img src="${article.imageUrl}" alt="${article.title}" class="article-card-image">
            <div class="article-card-content">
                <span class="article-card-category">${article.category}</span>
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
                <div class="article-card-actions">
                    <button class="action-btn delete" onclick="confirmDelete('${article.id}')">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Create New Article
async function createArticle(articleData) {
    try {
        const articlesRef = collection(db, 'articles');
        await addDoc(articlesRef, {
            ...articleData,
            publishedAt: Timestamp.now()
        });

        showToast('Artikel berhasil dipublikasikan!');
        await loadArticles();
        switchView('dashboard');
        
        // Reset form
        document.getElementById('articleForm').reset();
    } catch (error) {
        console.error('Error creating article:', error);
        
        // Fallback: save to localStorage if Firebase fails
        const localArticles = JSON.parse(localStorage.getItem('articles') || '[]');
        localArticles.unshift({
            id: Date.now().toString(),
            ...articleData,
            publishedAt: new Date()
        });
        localStorage.setItem('articles', JSON.stringify(localArticles));
        
        showToast('Artikel tersimpan secara lokal (Firebase tidak terkonfigurasi)');
        await loadArticles();
        switchView('dashboard');
        document.getElementById('articleForm').reset();
    }
}

// Delete Article
async function deleteArticle(articleId) {
    try {
        await deleteDoc(doc(db, 'articles', articleId));
        showToast('Artikel berhasil dihapus');
        await loadArticles();
    } catch (error) {
        console.error('Error deleting article:', error);
        
        // Fallback: delete from localStorage
        const localArticles = JSON.parse(localStorage.getItem('articles') || '[]');
        const filtered = localArticles.filter(a => a.id !== articleId);
        localStorage.setItem('articles', JSON.stringify(filtered));
        
        showToast('Artikel dihapus dari penyimpanan lokal');
        await loadArticles();
    }
}

// Delete Modal Functions
window.confirmDelete = function(articleId) {
    currentDeleteId = articleId;
    const modal = document.getElementById('deleteModal');
    modal.classList.add('active');
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    currentDeleteId = null;
};

// Form Submission
document.addEventListener('DOMContentLoaded', () => {
    // Load articles on init
    loadArticles();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Article Form
    const articleForm = document.getElementById('articleForm');
    articleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const articleData = {
            title: document.getElementById('articleTitle').value,
            category: document.getElementById('articleCategory').value,
            author: document.getElementById('articleAuthor').value,
            imageUrl: document.getElementById('articleImage').value,
            excerpt: document.getElementById('articleExcerpt').value,
            content: document.getElementById('articleContent').value,
            featured: document.getElementById('articleFeatured').checked
        };

        await createArticle(articleData);
    });

    // Category Filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter?.addEventListener('change', (e) => {
        const category = e.target.value;
        filterArticles(category);
    });

    // Search
    const articleSearch = document.getElementById('articleSearch');
    articleSearch?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchArticles(searchTerm);
    });

    // Delete Confirmation
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    confirmDeleteBtn?.addEventListener('click', async () => {
        if (currentDeleteId) {
            await deleteArticle(currentDeleteId);
            closeDeleteModal();
        }
    });

    // Close modal on overlay click
    const modalOverlay = document.querySelector('#deleteModal .modal-overlay');
    modalOverlay?.addEventListener('click', closeDeleteModal);
});

// Filter Articles by Category
function filterArticles(category) {
    const container = document.getElementById('articlesGrid');
    if (!container) return;

    let filtered = allArticles;
    if (category !== 'all') {
        filtered = allArticles.filter(a => 
            a.category.toLowerCase() === category.toLowerCase()
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>Tidak ada artikel dalam kategori ini</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(article => `
        <div class="article-card">
            <img src="${article.imageUrl}" alt="${article.title}" class="article-card-image">
            <div class="article-card-content">
                <span class="article-card-category">${article.category}</span>
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
                <div class="article-card-actions">
                    <button class="action-btn delete" onclick="confirmDelete('${article.id}')">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Search Articles
function searchArticles(searchTerm) {
    const container = document.getElementById('articlesGrid');
    if (!container) return;

    if (!searchTerm) {
        renderArticlesGrid();
        return;
    }

    const filtered = allArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.excerpt.toLowerCase().includes(searchTerm) ||
        article.category.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>Tidak ada artikel yang cocok dengan pencarian "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(article => `
        <div class="article-card">
            <img src="${article.imageUrl}" alt="${article.title}" class="article-card-image">
            <div class="article-card-content">
                <span class="article-card-category">${article.category}</span>
                <h3 class="article-card-title">${article.title}</h3>
                <p class="article-card-meta">Oleh ${article.author} • ${formatDate(article.publishedAt)}</p>
                <div class="article-card-actions">
                    <button class="action-btn delete" onclick="confirmDelete('${article.id}')">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
          }
          
