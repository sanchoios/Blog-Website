// Sample data structure - will be replaced with scraped data
let allPosts = [];
let currentSearchQuery = '';

// Generate URL-friendly slug from post title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s-]/gi, '') // Keep letters, numbers, spaces, hyphens
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Get post ID from URL slug
function getPostIdFromSlug(slug) {
    const post = allPosts.find(p => generateSlug(p.title) === slug);
    return post ? post.id : null;
}

// Update URL without page reload
function updateURL(postTitle) {
    const slug = generateSlug(postTitle);
    const newURL = `${window.location.origin}${window.location.pathname}?post=${slug}`;
    window.history.pushState({ postSlug: slug }, '', newURL);
}

// Load posts from JSON file
async function loadPosts() {
    try {
        const response = await fetch('posts.json');
        allPosts = await response.json();
        renderPosts(allPosts);

        // Check if there's a post in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const postSlug = urlParams.get('post');
        if (postSlug) {
            const postId = getPostIdFromSlug(postSlug);
            if (postId) {
                showPost(postId);
                // Highlight the post in sidebar
                document.querySelectorAll('.post-link').forEach(link => {
                    if (parseInt(link.dataset.id) === postId) {
                        link.classList.add('active');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        // If posts.json doesn't exist, use sample data
        allPosts = getSampleData();
        renderPosts(allPosts);
    }
}

// Sample data for demo purposes
function getSampleData() {
    return [
        {
            id: 1,
            title: "Getting Started with Minimalism",
            date: "2024-01-15",
            content: "<p>Minimalism is not about having less. It's about making room for what matters most.</p><p>In today's world, we're constantly bombarded with information, possessions, and obligations. The minimalist approach helps us cut through the noise and focus on what truly adds value to our lives.</p><h3>Key Principles</h3><ul><li>Quality over quantity</li><li>Intentional living</li><li>Focus on experiences</li></ul>"
        },
        {
            id: 2,
            title: "The Power of Simplicity in Design",
            date: "2024-02-20",
            content: "<p>Simple design is often the hardest to achieve. It requires careful consideration of every element.</p><p>When we remove the unnecessary, we make room for the essential. This principle applies not just to visual design, but to how we structure our thoughts, our code, and our lives.</p>"
        },
        {
            id: 3,
            title: "Thoughts on Digital Minimalism",
            date: "2024-03-10",
            content: "<p>Our digital lives have become cluttered with apps, notifications, and endless streams of content.</p><p>Digital minimalism is about using technology in a way that supports our values and goals, rather than letting it control us.</p><blockquote>\"The cost of a thing is the amount of what I will call life which is required to be exchanged for it, immediately or in the long run.\" - Henry David Thoreau</blockquote>"
        },
        {
            id: 4,
            title: "Building Better Habits",
            date: "2023-11-05",
            content: "<p>Habits shape our daily lives more than we realize. By being intentional about our habits, we can transform our lives.</p><p>Start small, be consistent, and focus on systems rather than goals.</p>"
        },
        {
            id: 5,
            title: "The Art of Saying No",
            date: "2023-09-12",
            content: "<p>Every yes to something is a no to something else. Learning to say no is essential for protecting our time and energy.</p><p>It's not about being negative or unhelpful—it's about being selective so we can say yes to what truly matters.</p>"
        }
    ];
}

// Group posts by year
function groupPostsByYear(posts) {
    const grouped = {};

    posts.forEach(post => {
        const year = new Date(post.date).getFullYear();
        if (!grouped[year]) {
            grouped[year] = [];
        }
        grouped[year].push(post);
    });

    // Sort years in descending order
    const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

    return sortedYears.map(year => ({
        year,
        posts: grouped[year].sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
}

// Render posts in the sidebar
function renderPosts(posts) {
    const postsList = document.getElementById('postsList');

    if (posts.length === 0) {
        postsList.innerHTML = '<div class="no-results">No posts found</div>';
        return;
    }

    const groupedPosts = groupPostsByYear(posts);

    postsList.innerHTML = groupedPosts.map(({ year, posts }) => `
        <div class="year-section">
            <div class="year-header">${year}</div>
            ${posts.map(post => `
                <a href="#" class="post-link ${post.hasTitle === false ? 'no-title' : ''}" data-id="${post.id}">
                    ${post.title}
                </a>
            `).join('')}
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = parseInt(link.dataset.id);
            showPost(postId);

            // Update active state
            document.querySelectorAll('.post-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Highlight search terms in text
function highlightText(text, query) {
    if (!query) return text;

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary regex to only highlight whole words
    const regex = new RegExp(`(^|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])(${escapedQuery})($|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])`, 'gi');
    return text.replace(regex, '$1<mark>$2</mark>$3');
}

// Show a specific post
function showPost(postId) {
    const post = allPosts.find(p => p.id === postId);

    if (!post) return;

    const welcomeMessage = document.getElementById('welcomeMessage');
    const postContent = document.getElementById('postContent');
    const postDate = document.getElementById('postDate');
    const postBody = document.getElementById('postBody');

    // Update URL with post slug
    updateURL(post.title);

    // Hide welcome message and show post
    welcomeMessage.style.display = 'none';
    postContent.style.display = 'block';

    // Set content
    postDate.textContent = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Add image if post has one
    let contentHTML = post.content;
    if (post.image) {
        contentHTML = `<img src="${post.image}" alt="${post.title}" class="post-image" loading="lazy">` + contentHTML;
    }

    // Apply highlighting if there's a search query
    if (currentSearchQuery) {
        postBody.innerHTML = highlightText(contentHTML, currentSearchQuery);

        // Scroll to first highlighted match after a short delay
        setTimeout(() => {
            const firstMark = postBody.querySelector('mark');
            if (firstMark) {
                firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    } else {
        postBody.innerHTML = contentHTML;
        // Scroll to top when no search
        document.querySelector('.content').scrollTop = 0;
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentSearchQuery = query;

        if (!query) {
            renderPosts(allPosts);
            return;
        }

        // Create word boundary regex for filtering
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wholeWordRegex = new RegExp(`(^|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])${escapedQuery}($|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])`, 'i');

        const filteredPosts = allPosts.filter(post => {
            const title = post.title.toLowerCase();
            const content = post.content.toLowerCase();

            // Only show whole word matches - no partial matches
            return wholeWordRegex.test(title) || wholeWordRegex.test(content);
        }).sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const aContent = a.content.toLowerCase();
            const bContent = b.content.toLowerCase();

            // Word boundary regex for whole word matching (reuse from filter)
            const wordBoundaryRegex = new RegExp(`(^|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])${escapedQuery}($|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])`, 'i');

            // Priority 1: Exact match in title
            const aExactTitle = aTitle === query;
            const bExactTitle = bTitle === query;
            if (aExactTitle !== bExactTitle) return bExactTitle - aExactTitle;

            // Priority 2: Whole word match in title
            const aWholeWordTitle = wordBoundaryRegex.test(aTitle);
            const bWholeWordTitle = wordBoundaryRegex.test(bTitle);
            if (aWholeWordTitle !== bWholeWordTitle) return bWholeWordTitle - aWholeWordTitle;

            // Priority 3: Title starts with query
            const aTitleStarts = aTitle.startsWith(query);
            const bTitleStarts = bTitle.startsWith(query);
            if (aTitleStarts !== bTitleStarts) return bTitleStarts - aTitleStarts;

            // Priority 4: Query in title (partial match)
            const aInTitle = aTitle.includes(query);
            const bInTitle = bTitle.includes(query);
            if (aInTitle !== bInTitle) return bInTitle - aInTitle;

            // Priority 5: Whole word match in content
            const aWholeWordContent = wordBoundaryRegex.test(aContent);
            const bWholeWordContent = wordBoundaryRegex.test(bContent);
            if (aWholeWordContent !== bWholeWordContent) return bWholeWordContent - aWholeWordContent;

            // Priority 6: Query at start of content
            const aContentStarts = aContent.startsWith(query);
            const bContentStarts = bContent.startsWith(query);
            if (aContentStarts !== bContentStarts) return bContentStarts - aContentStarts;

            // Priority 7: More whole word occurrences in content
            const wholeWordCountRegex = new RegExp(`(^|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])${escapedQuery}($|[\\s.,!?;:'"()\\[\\]{}«»""''—–-])`, 'gi');
            const aWholeWordCount = (aContent.match(wholeWordCountRegex) || []).length;
            const bWholeWordCount = (bContent.match(wholeWordCountRegex) || []).length;
            if (aWholeWordCount !== bWholeWordCount) return bWholeWordCount - aWholeWordCount;

            // Priority 8: More partial occurrences in content
            const aCount = (aContent.match(new RegExp(query, 'g')) || []).length;
            const bCount = (bContent.match(new RegExp(query, 'g')) || []).length;
            if (aCount !== bCount) return bCount - aCount;

            // Default: Sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        renderPosts(filteredPosts);
    });
}

// Mobile sidebar toggle functionality
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar && overlay) {
        // Toggle sidebar on button click
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = sidebar.classList.toggle('open');
            if (isOpen) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
                // Scroll sidebar to top to show header
                sidebar.scrollTop = 0;
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });

        // Close sidebar when a post is selected on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && e.target.classList.contains('post-link')) {
                setTimeout(() => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('show');
                    document.body.style.overflow = '';
                }, 200);
            }
        });

        // Clean up on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }
}

// Copy to clipboard helper function
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback();
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        console.error('Failed to copy:', err);
    }
    document.body.removeChild(textArea);
}

// Show copy feedback
function showCopyFeedback() {
    const shareButton = document.getElementById('shareButton');
    const originalText = shareButton.querySelector('span').textContent;
    shareButton.querySelector('span').textContent = 'Link copied!';
    shareButton.style.borderColor = 'var(--text-primary)';

    setTimeout(() => {
        shareButton.querySelector('span').textContent = originalText;
        shareButton.style.borderColor = 'var(--border-color)';
    }, 2000);
}

// Share button functionality
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');

    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const currentUrl = window.location.href;
            const postTitle = document.querySelector('.post-content h2')?.textContent || 'Blog Post';

            // Try to use native share API if available (mobile)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: postTitle,
                        url: currentUrl
                    });
                } catch (err) {
                    // User cancelled or share failed, fallback to copy
                    if (err.name !== 'AbortError') {
                        copyToClipboard(currentUrl);
                    }
                }
            } else {
                // Fallback: copy to clipboard
                copyToClipboard(currentUrl);
            }
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    setupSearch();
    setupSidebarToggle();
    setupShareButton();
});
