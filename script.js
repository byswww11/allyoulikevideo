// ==================== KONFIGURASI ====================
const DATA_URL = "https://allyoulikevideo.neocities.org/p/daftar.json";
const BASE_URL = "https://allyoulikevideo.neocities.org/p/";
const HOME_URL = "https://allyoulikevideo.neocities.org/";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const SEARCH_PAGE_URL = "https://allyoulikevideo.neocities.org/search";

// ==================== VARIABEL GLOBAL ====================
let allVideos = [];
let currentPageNum = 1;
let currentGenre = "";
let currentFilteredByGenre = [];
const itemsPerPage = 12;
const FEATURED_KEY = 'allyoulike_video_featured';
const FEATURED_TIMESTAMP_KEY = 'allyoulike_video_ts';
const PAGE_KEY = 'allyoulike_video_page';
const SIX_HOURS = 6 * 60 * 60 * 1000;
const FEATURED_COUNT = 4;

// ==================== FUNGSI UTILITY ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function goToSearchPage(query) {
    if (query && query.trim()) {
        window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
    } else {
        window.location.href = SEARCH_PAGE_URL;
    }
}

function showRandomVideo() {
    if (allVideos.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allVideos.length);
    const randomItem = allVideos[randomIndex];
    let targetLink = randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link;
    window.open(targetLink, '_blank');
}

function saveCurrentPage(page) {
    localStorage.setItem(PAGE_KEY, page.toString());
}

function getLastPage() {
    const savedPage = localStorage.getItem(PAGE_KEY);
    if (savedPage && !isNaN(parseInt(savedPage))) return parseInt(savedPage);
    return 1;
}

function getFeaturedVideos() {
    const now = Date.now();
    const savedTimestamp = localStorage.getItem(FEATURED_TIMESTAMP_KEY);
    const savedFeatured = localStorage.getItem(FEATURED_KEY);
    
    if (savedTimestamp && savedFeatured && (now - parseInt(savedTimestamp)) < SIX_HOURS) {
        try {
            return JSON.parse(savedFeatured);
        } catch(e) { console.warn(e); }
    }
    if (allVideos.length > 0) {
        const shuffledCopy = [...allVideos];
        for (let i = shuffledCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledCopy[i], shuffledCopy[j]] = [shuffledCopy[j], shuffledCopy[i]];
        }
        const selected = shuffledCopy.slice(0, FEATURED_COUNT);
        localStorage.setItem(FEATURED_KEY, JSON.stringify(selected));
        localStorage.setItem(FEATURED_TIMESTAMP_KEY, now.toString());
        return selected;
    }
    return [];
}

function filterByGenre(genre) {
    currentGenre = genre;
    currentPageNum = 1;
    
    if (!genre || genre === "") {
        currentFilteredByGenre = [...allVideos];
    } else {
        currentFilteredByGenre = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            return videoGenre.includes(genre.toLowerCase());
        });
    }
    
    const newUploadsTitle = document.getElementById('newUploadsTitle');
    if (newUploadsTitle && genre) {
        newUploadsTitle.innerHTML = `Genre: ${genre}`;
    } else if (newUploadsTitle) {
        newUploadsTitle.innerHTML = `New Uploads`;
    }
    
    renderPaginatedGrid();
    updatePagination();
    
    const genreDropdown = document.getElementById('genreDropdown');
    if (genreDropdown) genreDropdown.classList.remove('show');
}

// ==================== FUNGSI RENDER YANG DIUBAH ====================
function renderVideoGrid(videoArray, gridId, isFeatured = false, isNewUploads = false, currentPage = 1) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    if (!videoArray || videoArray.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No videos in this category.</div>';
        return;
    }
    videoArray.forEach((video, idx) => {
        let link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        let imgUrl = video.image || "https://placehold.co/600x400?text=Video+Thumb";
        let title = video.title || "Untitled Video";
        let newBadge = '';
        
        // NEW BADGE HANYA TAMPIL DI HALAMAN 1 (currentPage === 1)
        if (isNewUploads && currentPage === 1 && idx < 5 && !currentGenre) {
            newBadge = '<span class="badge-new">NEW</span>';
        }
        
        grid.innerHTML += `
            <div class="video-item" data-url="${link}">
                <div class="video-thumb-container">
                    <img src="${imgUrl}" class="video-thumb" loading="lazy" 
                         onerror="this.src='https://placehold.co/600x400?text=Video+Unavailable'">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                    ${newBadge}
                </div>
                <div class="video-title">
                    ${escapeHtml(title)}
                </div>
            </div>
        `;
    });
    document.querySelectorAll(`#${gridId} .video-item`).forEach(card => {
        card.addEventListener('click', (e) => {
            const url = card.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = currentFilteredByGenre.slice(start, end);
    renderVideoGrid(paginatedData, 'new-videos-grid', false, true, currentPageNum);
}

function goToVideoPage(page) {
    currentPageNum = page;
    renderPaginatedGrid();
    updatePagination();
    saveCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredByGenre.length / itemsPerPage);
    if (totalPages <= 1) return;
    
    const createBtn = (text, onClick, isDisabled = false, extraClass = 'pagination-arrow') => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.className = extraClass;
        if (isDisabled) btn.classList.add('disabled');
        btn.onclick = onClick;
        return btn;
    };
    
    container.appendChild(createBtn('«', () => { if (currentPageNum > 1) goToVideoPage(1); }, currentPageNum === 1));
    container.appendChild(createBtn('‹', () => { if (currentPageNum > 1) goToVideoPage(currentPageNum - 1); }, currentPageNum === 1));
    
    let startPage = 1, endPage = totalPages;
    const maxVisible = 5;
    if (totalPages > maxVisible + 2) {
        if (currentPageNum <= 3) { startPage = 1; endPage = maxVisible; }
        else if (currentPageNum >= totalPages - 2) { startPage = totalPages - maxVisible + 1; endPage = totalPages; }
        else { startPage = currentPageNum - 2; endPage = currentPageNum + 2; }
    }
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.className = `pagination-btn ${i === currentPageNum ? 'active' : ''}`;
        pageBtn.onclick = () => goToVideoPage(i);
        container.appendChild(pageBtn);
    }
    if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.innerText = '...';
        dots.className = 'pagination-dots';
        container.appendChild(dots);
    }
    if (endPage < totalPages) {
        const lastBtn = document.createElement('button');
        lastBtn.innerText = totalPages;
        lastBtn.className = `pagination-btn ${totalPages === currentPageNum ? 'active' : ''}`;
        lastBtn.onclick = () => goToVideoPage(totalPages);
        container.appendChild(lastBtn);
    }
    container.appendChild(createBtn('›', () => { if (currentPageNum < totalPages) goToVideoPage(currentPageNum + 1); }, currentPageNum === totalPages));
    container.appendChild(createBtn('»', () => { if (currentPageNum < totalPages) goToVideoPage(totalPages); }, currentPageNum === totalPages));
}

// ==================== ATTACH EVENT LISTENER HEADER ====================
function attachHeaderEvents() {
    const searchDesktopBtn = document.getElementById('searchBtnDesktop');
    const searchDesktopInput = document.getElementById('searchInputDesktop');
    if (searchDesktopBtn) searchDesktopBtn.onclick = () => goToSearchPage(searchDesktopInput.value);
    if (searchDesktopInput) searchDesktopInput.onkeypress = (e) => { if (e.key === 'Enter') goToSearchPage(e.target.value); };
    
    const mobileIcon = document.getElementById('searchIconMobile');
    const mobileOverlay = document.getElementById('mobileSearchOverlay');
    const closeSearch = document.getElementById('closeSearchBtn');
    const mobileSearchBtn = document.getElementById('searchBtnMobile');
    const mobileSearchInput = document.getElementById('searchInputMobile');
    
    if (mobileIcon) mobileIcon.onclick = () => { mobileOverlay.style.display = 'block'; setTimeout(() => mobileSearchInput?.focus(), 100); };
    if (closeSearch) closeSearch.onclick = () => { mobileOverlay.style.display = 'none'; if (mobileSearchInput) mobileSearchInput.value = ''; };
    if (mobileSearchBtn) mobileSearchBtn.onclick = () => { const q = mobileSearchInput.value.trim(); mobileOverlay.style.display = 'none'; goToSearchPage(q); };
    if (mobileSearchInput) mobileSearchInput.onkeypress = (e) => { if (e.key === 'Enter') { const q = e.target.value.trim(); mobileOverlay.style.display = 'none'; goToSearchPage(q); } };
    if (mobileOverlay) mobileOverlay.addEventListener('click', (e) => { if (e.target === mobileOverlay) mobileOverlay.style.display = 'none'; });
    
    const navHome = document.getElementById('navHome');
    const navRandom = document.getElementById('navRandom');
    const navComic = document.getElementById('navComic');
    const navVideo34 = document.getElementById('navVideo34');
    const logoElem = document.getElementById('logoClick');
    
    if (navHome) navHome.onclick = (e) => { e.preventDefault(); window.location.href = HOME_URL; };
    if (navRandom) navRandom.onclick = (e) => { e.preventDefault(); if (allVideos.length) showRandomVideo(); };
    if (navComic) navComic.onclick = (e) => { e.preventDefault(); window.location.href = COMIC_URL; };
    if (navVideo34) navVideo34.onclick = (e) => { e.preventDefault(); window.open(VIDEO34_URL, '_blank'); };
    if (logoElem) logoElem.onclick = () => { window.location.href = HOME_URL; };
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    
    if (genreBtn) {
        genreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            genreDropdown.classList.toggle('show');
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!genreBtn?.contains(e.target) && !genreDropdown?.contains(e.target)) {
            genreDropdown?.classList.remove('show');
        }
    });
    
    document.querySelectorAll('.genre-dropdown-content a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const genre = link.getAttribute('data-genre');
            window.location.href = `https://allyoulikevideo.neocities.org/genre.html?genre=${encodeURIComponent(genre)}`;
        });
    });
}

// ==================== LOAD HEADER, FOOTER & DATA ====================
async function loadHeader() {
    try {
        const response = await fetch('header.html');
        const headerHtml = await response.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        attachHeaderEvents();
    } catch (error) {
        console.error('Gagal load header:', error);
    }
}

async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        const footerHtml = await response.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
    } catch (error) {
        console.error('Gagal load footer:', error);
    }
}

async function loadVideoData() {
    try {
        document.getElementById('featured-grid').innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading video gallery...</div>';
        document.getElementById('new-videos-grid').innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Preparing video collection...</div>';
        
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let pages = data.pages || [];
        allVideos = pages.map((item, idx) => ({
            ...item,
            views: Math.floor(Math.random() * 50000) + 1000,
            duration: `${Math.floor(Math.random() * 20) + 2}:${Math.floor(Math.random() * 59)}`,
            type: 'video'
        }));
        allVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
        currentFilteredByGenre = [...allVideos];
        
        if (allVideos.length === 0) {
            document.getElementById('featured-grid').innerHTML = '<div class="no-data-message">📭 No videos available at this time.</div>';
            document.getElementById('new-videos-grid').innerHTML = '<div class="no-data-message">📭 No videos available.</div>';
            return;
        }
        
        const featuredVids = getFeaturedVideos();
        renderVideoGrid(featuredVids, 'featured-grid', false, false);
        
        const lastPage = getLastPage();
        currentPageNum = lastPage;
        const totalPages = Math.ceil(currentFilteredByGenre.length / itemsPerPage);
        if (currentPageNum > totalPages) currentPageNum = 1;
        renderPaginatedGrid();
        updatePagination();
    } catch (err) {
        console.error(err);
        document.getElementById('featured-grid').innerHTML = `<div class="no-data-message">❌ Failed to load videos: ${err.message}</div>`;
        document.getElementById('new-videos-grid').innerHTML = '<div class="no-data-message">Failed to load video data.</div>';
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadVideoData();
});