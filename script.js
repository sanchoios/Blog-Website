// 1. Firebase kutubxonalarini chaqirish
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. Sizning Firebase kalitlaringiz
const firebaseConfig = {
    apiKey: "AIzaSyCUjK65qjlK9MSgwQrZty8qsbQDzJMLGx8",
    authDomain: "myblog-51a94.firebaseapp.com",
    projectId: "myblog-51a94",
    storageBucket: "myblog-51a94.firebasestorage.app",
    messagingSenderId: "723129160787",
    appId: "1:723129160787:web:1b2e53e5e56a5dd81b62a6",
    measurementId: "G-4M6HLHVZH2"
};

// 3. Bazani ishga tushirish
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allPosts = [];
let currentSearchQuery = '';

// Havola (URL) uchun qulay nom yasash
function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9а-яё\s-]/gi, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function getPostIdFromSlug(slug) {
    const post = allPosts.find(p => generateSlug(p.title) === slug);
    return post ? post.id : null;
}

function updateURL(postTitle) {
    const slug = generateSlug(postTitle);
    const newURL = `${window.location.origin}${window.location.pathname}?post=${slug}`;
    window.history.pushState({ postSlug: slug }, '', newURL);
}

// BAZADAN POSTLARNI YUKLASH (Tartiblash qo'shildi)
async function loadPosts() {
    try {
        const postsList = document.getElementById('postsList');
        postsList.innerHTML = '<div style="padding: 20px; color: var(--text-secondary); text-align: center;">Ma\'lumotlar yuklanmoqda...</div>';

        // Bazadan tortib olamiz
        const q = query(collection(db, "posts"));
        const querySnapshot = await getDocs(q);
        
        allPosts = [];
        let indexId = 1;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allPosts.push({
                id: indexId++, 
                title: data.title,
                date: data.date,
                content: data.content,
                // Tartiblash uchun vaqtni to'g'ri shaklga o'giramiz:
                timestamp: data.timestamp && data.timestamp.toMillis ? data.timestamp.toMillis() : new Date(data.date).getTime()
            });
        });

        // MANA SHU YERDA TARTIBLAYMIZ (Eng yangilari birinchi chiqadi)
        allPosts.sort((a, b) => b.timestamp - a.timestamp);

        renderPosts(allPosts);

        // URL da post so'ralgan bo'lsa, o'shani ochish
        const urlParams = new URLSearchParams(window.location.search);
        const postSlug = urlParams.get('post');
        if (postSlug) {
            const postId = getPostIdFromSlug(postSlug);
            if (postId) {
                showPost(postId);
                document.querySelectorAll('.post-link').forEach(link => {
                    if (parseInt(link.dataset.id) === postId) link.classList.add('active');
                });
            }
        } else if (allPosts.length > 0) {
            // Agar havola toza bo'lsa, avtomatik eng birinchi maqolani ochib beradi
            showPost(allPosts[0].id);
            document.querySelector('.post-link').classList.add('active');
        }

    } catch (error) {
        console.error('Xatolik:', error);
        document.getElementById('postsList').innerHTML = '<div class="no-results">Postlarni yuklashda xatolik yuz berdi.</div>';
    }
}

// Yillar bo'yicha guruhlash
function groupPostsByYear(posts) {
    const grouped = {};
    posts.forEach(post => {
        const year = new Date(post.date).getFullYear() || new Date().getFullYear();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(post);
    });

    const sortedYears = Object.keys(grouped).sort((a, b) => b - a);
    return sortedYears.map(year => ({
        year,
        posts: grouped[year].sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
}

// Chap paneldagi ro'yxatni chizish
function renderPosts(posts) {
    const postsList = document.getElementById('postsList');
    if (posts.length === 0) {
        postsList.innerHTML = '<div class="no-results">Hozircha postlar yo\'q</div>';
        return;
    }

    const groupedPosts = groupPostsByYear(posts);
    postsList.innerHTML = groupedPosts.map(({ year, posts }) => `
        <div class="year-section">
            <div class="year-header">${year}</div>
            ${posts.map(post => `
                <a href="#" class="post-link" data-id="${post.id}">
                    ${post.title}
                </a>
            `).join('')}
        </div>
    `).join('');

    // Bosganda maqolani ochish
    document.querySelectorAll('.post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = parseInt(link.dataset.id);
            showPost(postId);

            document.querySelectorAll('.post-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function highlightText(text, query) {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])(${escapedQuery})($|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])`, 'gi');
    return text.replace(regex, '$1<mark>$2</mark>$3');
}

// Tanlangan maqolani ekranda ko'rsatish
function showPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const welcomeMessage = document.getElementById('welcomeMessage');
    const postContent = document.getElementById('postContent');
    const postDate = document.getElementById('postDate');
    const postBody = document.getElementById('postBody');

    updateURL(post.title);
    welcomeMessage.style.display = 'none';
    postContent.style.display = 'block';

    postDate.textContent = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Marked.js yordamida Markdown matnini avtomat chiroyli HTML ga o'girish
    let contentHTML = window.marked ? window.marked.parse(post.content) : post.content;

    if (currentSearchQuery) {
        postBody.innerHTML = highlightText(contentHTML, currentSearchQuery);
        setTimeout(() => {
            const firstMark = postBody.querySelector('mark');
            if (firstMark) firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    } else {
        postBody.innerHTML = contentHTML;
        document.querySelector('.content').scrollTop = 0;
    }
}

// Qidiruv tizimi
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentSearchQuery = query;

        if (!query) {
            renderPosts(allPosts);
            return;
        }

        const filteredPosts = allPosts.filter(post => {
            return post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query);
        });
        renderPosts(filteredPosts);
    });
}

// Mobil qurilmalar uchun yon panelni yopib-ochish
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar && overlay) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = sidebar.classList.toggle('open');
            if (isOpen) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                sidebar.scrollTop = 0;
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && e.target.classList.contains('post-link')) {
                setTimeout(() => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                    document.body.style.overflow = '';
                }, 200);
            }
        });
    }
}

// Havola nusxalash funksiyasi
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showCopyFeedback()).catch(() => fallbackCopyToClipboard(text));
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); showCopyFeedback(); } catch (err) { console.error('Failed to copy:', err); }
    document.body.removeChild(textArea);
}

function showCopyFeedback() {
    const shareButton = document.getElementById('shareButton');
    const originalText = shareButton.querySelector('span').textContent;
    shareButton.querySelector('span').textContent = 'Nusxa olindi!';
    shareButton.style.borderColor = 'var(--text-primary)';
    setTimeout(() => {
        shareButton.querySelector('span').textContent = originalText;
        shareButton.style.borderColor = 'var(--border-color)';
    }, 2000);
}

function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const currentUrl = window.location.href;
            const postTitle = document.querySelector('.post-content h2')?.textContent || 'Blog Post';
            if (navigator.share) {
                try {
                    await navigator.share({ title: postTitle, url: currentUrl });
                } catch (err) {
                    if (err.name !== 'AbortError') copyToClipboard(currentUrl);
                }
            } else {
                copyToClipboard(currentUrl);
            }
        });
    }
}

// Barcha funksiyalarni ishga tushirish
loadPosts();
setupSearch();
setupSidebarToggle();
setupShareButton();