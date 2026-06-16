// Application State
const state = {
    notes: [],
    filteredNotes: [],
    selectedNoteId: null,
    activeCategory: 'all',
    searchQuery: '',
    sortOrder: 'newest',
    theme: 'dark'
};

// DOM Elements
const elements = {
    themeToggle: document.getElementById('theme-toggle'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshSpinner: document.getElementById('refresh-spinner'),
    searchInput: document.getElementById('search-input'),
    categoryFiltersContainer: document.getElementById('category-filters-container'),
    sortSelect: document.getElementById('sort-select'),
    feedGrid: document.getElementById('feed-grid'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    errorDisplay: document.getElementById('error-display'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyState: document.getElementById('empty-state'),
    clearFiltersBtn: document.getElementById('clear-filters-btn'),
    feedResultsTitle: document.getElementById('feed-results-title'),
    resultsCount: document.getElementById('results-count'),
    statusText: document.getElementById('status-text'),
    lastFetchedText: document.getElementById('last-fetched-text'),
    
    // Floating Selection Bar
    floatingBar: document.getElementById('floating-bar'),
    selectedCountNumber: document.getElementById('selected-count-number'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    tweetSelectionBtn: document.getElementById('tweet-selection-btn'),
    
    // Composer Modal
    composerModal: document.getElementById('composer-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    publishTweetBtn: document.getElementById('publish-tweet-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    composerPreviewCard: document.getElementById('composer-preview-card'),
    previewCategoryBadge: document.getElementById('preview-category-badge'),
    previewDate: document.getElementById('preview-date'),
    previewSnippet: document.getElementById('preview-snippet'),
    addHashtagBq: document.getElementById('add-hashtag-bq'),
    addHashtagGcp: document.getElementById('add-hashtag-gcp'),
    charCount: document.getElementById('char-count'),
    progressCircle: document.querySelector('.progress-ring__circle'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// Progress Ring Configuration
const ringRadius = 10;
const ringCircumference = 2 * Math.PI * ringRadius;
if (elements.progressCircle) {
    elements.progressCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    elements.progressCircle.style.strokeDashoffset = ringCircumference;
}

// Initial Configuration
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchNotes(false);
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('bq-notes-theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bq-notes-theme', theme);
}

function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        showToast(`Switched to ${nextTheme} mode`, 'info');
    });

    // Refresh Button
    elements.refreshBtn.addEventListener('click', () => {
        fetchNotes(true);
    });

    // Search Input
    elements.searchInput.addEventListener('input', debounce((e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        applyFiltersAndSort();
    }, 250));

    // Sort Select
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        applyFiltersAndSort();
    });

    // Retry Button
    elements.retryBtn.addEventListener('click', () => {
        fetchNotes(true);
    });

    // Reset Filters Button
    elements.clearFiltersBtn.addEventListener('click', resetFilters);

    // Floating Bar Clear Selection
    elements.clearSelectionBtn.addEventListener('click', clearSelection);

    // Floating Bar Tweet
    elements.tweetSelectionBtn.addEventListener('click', () => {
        if (state.selectedNoteId) {
            const note = state.notes.find(n => n.id === state.selectedNoteId);
            if (note) openComposer(note);
        }
    });

    // Modal Close
    elements.closeModalBtn.addEventListener('click', closeComposer);
    elements.cancelModalBtn.addEventListener('click', closeComposer);
    
    // Modal click outside to close
    elements.composerModal.addEventListener('click', (e) => {
        if (e.target === elements.composerModal) {
            closeComposer();
        }
    });

    // Textarea character counting
    elements.tweetTextarea.addEventListener('input', updateCharCount);

    // Hashtag Pills
    elements.addHashtagBq.addEventListener('click', () => appendHashtag('#BigQuery'));
    elements.addHashtagGcp.addEventListener('click', () => appendHashtag('#GoogleCloud'));

    // Post to X
    elements.publishTweetBtn.addEventListener('click', publishTweet);
}

// Fetch Notes from API
async function fetchNotes(force = false) {
    showLoading(true);
    elements.errorDisplay.classList.add('hidden');
    
    const url = `/api/notes${force ? '?force=true' : ''}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message);
        }
        
        state.notes = data.notes;
        elements.lastFetchedText.textContent = data.last_fetched;
        elements.statusText.textContent = data.source === 'stale_cache' ? 'Offline (Stale Cache)' : 'Connected';
        elements.statusText.className = `meta-value ${data.source === 'stale_cache' ? 'char-count-warning' : 'text-success'}`;
        
        if (force) {
            showToast('Feed refreshed successfully', 'success');
        }
        
        buildCategoryFilters();
        applyFiltersAndSort();
        
    } catch (error) {
        console.error('Error fetching release notes:', error);
        elements.errorMessage.textContent = error.message || 'An error occurred while fetching the release notes.';
        elements.errorDisplay.classList.remove('hidden');
        elements.feedGrid.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        showToast('Failed to load release notes', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        elements.refreshBtn.classList.add('loading');
        elements.skeletonLoader.classList.remove('hidden');
        elements.feedGrid.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.refreshBtn.classList.remove('loading');
        elements.skeletonLoader.classList.add('hidden');
    }
}

// Dynamic Filter Builder
function buildCategoryFilters() {
    // Get unique categories and count them
    const counts = { all: state.notes.length };
    state.notes.forEach(note => {
        const cat = note.category.toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
    });

    // Keep active category check
    const categories = Object.keys(counts).filter(k => k !== 'all');
    
    // Clear dynamic filters (leave All Updates)
    const allBtn = document.getElementById('filter-all');
    document.getElementById('count-all').textContent = counts.all;
    
    // Remove existing dynamic filter buttons
    const dynamicButtons = elements.categoryFiltersContainer.querySelectorAll('.filter-btn:not(#filter-all)');
    dynamicButtons.forEach(btn => btn.remove());

    // Add new buttons
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${state.activeCategory === cat ? 'active' : ''}`;
        btn.setAttribute('data-category', cat);
        
        // Format category name (capitalize first letter)
        const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        btn.innerHTML = `
            <span>${displayName}</span>
            <span class="count-badge">${counts[cat]}</span>
        `;
        
        btn.addEventListener('click', () => {
            setCategoryFilter(cat);
        });
        
        elements.categoryFiltersContainer.appendChild(btn);
    });
    
    // Make sure 'All' button has click handler
    allBtn.onclick = () => setCategoryFilter('all');
}

function setCategoryFilter(category) {
    state.activeCategory = category;
    
    // Update active classes
    const buttons = elements.categoryFiltersContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    applyFiltersAndSort();
}

// Filtering and Sorting Algorithm
function applyFiltersAndSort() {
    let result = [...state.notes];

    // 1. Category Filter
    if (state.activeCategory !== 'all') {
        result = result.filter(n => n.category.toLowerCase() === state.activeCategory);
    }

    // 2. Search query filter
    if (state.searchQuery) {
        result = result.filter(n => {
            return n.date.toLowerCase().includes(state.searchQuery) ||
                   n.category.toLowerCase().includes(state.searchQuery) ||
                   n.content_text.toLowerCase().includes(state.searchQuery);
        });
    }

    // 3. Sorting
    result.sort((a, b) => {
        const dateA = new Date(a.date_iso);
        const dateB = new Date(b.date_iso);
        return state.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    state.filteredNotes = result;
    renderFeed();
}

// Render the grid of cards
function renderFeed() {
    elements.feedGrid.innerHTML = '';
    
    // Update title and counts
    const categoryName = state.activeCategory === 'all' ? 'All Updates' : state.activeCategory.charAt(0).toUpperCase() + state.activeCategory.slice(1) + 's';
    elements.feedResultsTitle.textContent = categoryName;
    elements.resultsCount.textContent = `${state.filteredNotes.length} updates`;

    if (state.filteredNotes.length === 0) {
        elements.feedGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.feedGrid.classList.remove('hidden');

    state.filteredNotes.forEach(note => {
        const card = document.createElement('div');
        const isSelected = state.selectedNoteId === note.id;
        card.className = `release-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-id', note.id);
        
        // Highlight terms if searching
        let bodyHtml = note.content_html;
        let titleText = note.date;
        if (state.searchQuery) {
            bodyHtml = highlightText(bodyHtml, state.searchQuery);
            titleText = highlightText(titleText, state.searchQuery);
        }

        const catLower = note.category.toLowerCase();
        
        card.innerHTML = `
            <div class="card-top">
                <div class="card-meta-left">
                    <div class="selection-indicator">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <span class="category-badge ${catLower}">${note.category}</span>
                </div>
                <span class="card-date">${titleText}</span>
            </div>
            <div class="card-body">
                ${bodyHtml}
            </div>
            <div class="card-actions">
                <button class="btn-card-action btn-card-tweet" aria-label="Tweet this update">
                    <svg width="12" height="12" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px;">
                        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.268 515.685L658.737 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="currentColor"/>
                    </svg>
                    Tweet
                </button>
            </div>
        `;

        // Card Click selection (avoid triggering when clicking on links or action buttons)
        card.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('.btn-card-action') || e.target.closest('code')) {
                // If clicked tweet action
                if (e.target.closest('.btn-card-tweet')) {
                    openComposer(note);
                }
                return;
            }
            toggleSelectCard(note.id);
        });

        elements.feedGrid.appendChild(card);
    });
}

// Selection Functions
function toggleSelectCard(id) {
    if (state.selectedNoteId === id) {
        state.selectedNoteId = null;
    } else {
        state.selectedNoteId = id;
    }
    
    // Update card classes directly for performance/visual transition
    const cards = elements.feedGrid.querySelectorAll('.release-card');
    cards.forEach(card => {
        const cardId = card.getAttribute('data-id');
        if (cardId === state.selectedNoteId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    updateFloatingBar();
}

function clearSelection() {
    state.selectedNoteId = null;
    const cards = elements.feedGrid.querySelectorAll('.release-card');
    cards.forEach(card => card.classList.remove('selected'));
    updateFloatingBar();
}

function updateFloatingBar() {
    if (state.selectedNoteId) {
        elements.selectedCountNumber.textContent = "1";
        elements.floatingBar.classList.remove('hidden');
    } else {
        elements.floatingBar.classList.add('hidden');
    }
}

// Tweet Composer Functions
function openComposer(note) {
    // Fill in preview details
    elements.previewCategoryBadge.textContent = note.category;
    elements.previewCategoryBadge.className = `preview-badge ${note.category.toLowerCase()}`;
    elements.previewDate.textContent = note.date;
    
    // Substring preview snippet
    let snippet = note.content_text;
    if (snippet.length > 180) {
        snippet = snippet.substring(0, 177) + "...";
    }
    elements.previewSnippet.textContent = snippet;
    
    // Generate default tweet
    const defaultText = buildDefaultTweetText(note);
    elements.tweetTextarea.value = defaultText;
    
    // Trigger count refresh
    updateCharCount();
    
    // Display Modal
    elements.composerModal.classList.remove('hidden');
    elements.tweetTextarea.focus();
}

function closeComposer() {
    elements.composerModal.classList.add('hidden');
}

function buildDefaultTweetText(note) {
    const header = `📢 BigQuery Update: ${note.category} (${note.date})\n\n`;
    const footer = `\n\n🔗 ${note.link}`;
    const maxBodyLen = 280 - header.length - footer.length - 5;
    
    let bodyText = note.content_text;
    if (bodyText.length > maxBodyLen) {
        bodyText = bodyText.substring(0, maxBodyLen - 3) + "...";
    }
    
    return `${header}${bodyText}${footer}`;
}

function updateCharCount() {
    const text = elements.tweetTextarea.value;
    const length = text.length;
    const remaining = 280 - length;
    
    elements.charCount.textContent = remaining;
    
    // Color states for warning limits
    if (remaining < 0) {
        elements.charCount.className = 'char-count-text char-count-danger';
        elements.publishTweetBtn.disabled = true;
        elements.publishTweetBtn.style.opacity = '0.5';
        elements.publishTweetBtn.style.pointerEvents = 'none';
    } else if (remaining <= 20) {
        elements.charCount.className = 'char-count-text char-count-warning';
        elements.publishTweetBtn.disabled = false;
        elements.publishTweetBtn.style.opacity = '1';
        elements.publishTweetBtn.style.pointerEvents = 'auto';
    } else {
        elements.charCount.className = 'char-count-text';
        elements.publishTweetBtn.disabled = false;
        elements.publishTweetBtn.style.opacity = '1';
        elements.publishTweetBtn.style.pointerEvents = 'auto';
    }

    // Circular Progress stroke calculations
    const pct = Math.min(length / 280, 1);
    const offset = ringCircumference - (pct * ringCircumference);
    
    if (elements.progressCircle) {
        elements.progressCircle.style.strokeDashoffset = offset;
        
        // Progress color states
        if (remaining < 0) {
            elements.progressCircle.style.stroke = '#ef4444';
        } else if (remaining <= 20) {
            elements.progressCircle.style.stroke = '#fb923c';
        } else {
            elements.progressCircle.style.stroke = 'var(--accent-color)';
        }
    }
}

function appendHashtag(tag) {
    const text = elements.tweetTextarea.value;
    const separator = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
    elements.tweetTextarea.value = text + separator + tag;
    updateCharCount();
    elements.tweetTextarea.focus();
}

function publishTweet() {
    const tweetText = elements.tweetTextarea.value;
    if (tweetText.length > 280) {
        showToast('Tweet exceeds 280 characters limit', 'error');
        return;
    }
    
    // Build Web Intent URL
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
    
    closeComposer();
    showToast('Redirected to Twitter / X composer!', 'success');
}

// Reset operations
function resetFilters() {
    elements.searchInput.value = '';
    state.searchQuery = '';
    setCategoryFilter('all');
}

// Text Hilite helper
function highlightText(text, search) {
    if (!search) return text;
    // Avoid highlights breaking HTML tags by doing a safe replacement (replace text matching outside tags)
    // For simplicity and safety with XML nodes: we construct regex that searches for terms
    // Standard approach: Replace matching patterns that are not inside HTML tags <...>
    try {
        const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
        // A simple text split by html tags to only replace on raw text nodes
        const parts = text.split(/(<[^>]+>)/g);
        const highlightedParts = parts.map(part => {
            if (part.startsWith('<') && part.endsWith('>')) {
                return part; // Skip tags
            }
            return part.replace(regex, '<mark>$1</mark>');
        });
        return highlightedParts.join('');
    } catch (e) {
        return text;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Debouncer helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toast Helpers
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon selection
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'warning') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else { // info
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
    
    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Animation in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Animation out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}
