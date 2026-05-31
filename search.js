// search.js
// Allyoulike Video - Main JavaScript File

const DATA_URL = "https://allyoulikevideo.neocities.org/p/daftar.json";
const BASE_URL = "https://allyoulikevideo.neocities.org/p/";
const HOME_URL = "https://allyoulikevideo.neocities.org/";
const COMIC_URL = "https://allyoulikecomic.neocities.org/";
const VIDEO34_URL = "https://www.google.com";
const ITEMS_PER_PAGE = 24;

let allVideos = [];
let currentQuery = "";
let currentPageNum = 1;
let currentFilteredResults = [];
let currentGenre = "";

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function getRandomVideo() {
    if (!allVideos.length) return;
    const randomItem = allVideos[Math.floor(Math.random() * allVideos.length)];
    window.open(randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link, '_blank');
}

function goHome() { 
    window.location.href = HOME_URL; 
}

function goComic() { 
    window.location.href = COMIC_URL; 
}

function openVideo34() { 
    window.open(VIDEO34_URL, '_blank'); 
}

function filterByGenre(genre) {
    currentGenre = genre;
    currentQuery = "";
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) searchInput.value = "";
    const searchInfoBar = document.getElementById('searchInfoBar');
    if (searchInfoBar) searchInfoBar.style.display = 'none';
    
    if (!genre || genre === "") {
        currentFilteredResults = [...allVideos];
    } else {
        currentFilteredResults = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            return videoGenre.includes(genre.toLowerCase());
        });
    }
    currentPageNum = 1;
    renderPaginatedGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const genreDropdown = document.getElementById('genreDropdown');
    if (genreDropdown) genreDropdown.classList.remove('show');
}

async function loadData() {
    try {
        const resultGrid = document.getElementById('resultGrid');
        if (resultGrid) {
            resultGrid.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-spinner fa-pulse"></i></div><div class="empty-title">Loading videos...</div><div class="empty-subtitle">Please wait...</div></div>`;
        }
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        allVideos = (data.pages || []).map(item => ({ ...item }));
        allVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
        const urlParams = new URLSearchParams(window.location.search);
        const q = urlParams.get('q');
        if (q && q.trim()) { 
            const searchInput = document.getElementById('mainSearchInput');
            if (searchInput) searchInput.value = q;
            performSearch(q); 
        } else { 
            currentFilteredResults = [...allVideos]; 
            renderPaginatedGrid(); 
            const searchInfoBar = document.getElementById('searchInfoBar');
            if (searchInfoBar) searchInfoBar.style.display = 'none'; 
        }
    } catch(err) {
        const resultGrid = document.getElementById('resultGrid');
        if (resultGrid) {
            resultGrid.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-regular fa-circle-exclamation"></i></div><div class="empty-title">Failed to load</div><div class="empty-subtitle">${err.message}</div></div>`;
        }
    }
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * ITEMS_PER_PAGE;
    const paginatedData = currentFilteredResults.slice(start, start + ITEMS_PER_PAGE);
    renderGrid(paginatedData);
    renderPagination();
}

function renderGrid(videos) {
    const grid = document.getElementById('resultGrid');
    if (!grid) return;
    
    if (!videos.length) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fa-regular fa-face-frown"></i></div><div class="empty-title">No videos found</div><div class="empty-subtitle">We couldn't find any videos matching <span>"${escapeHtml(currentQuery || currentGenre)}"</span></div></div>`;
        return;
    }
    grid.style.display = 'grid';
    grid.innerHTML = videos.map(v => `<div class="video-item" data-url="${v.link.startsWith('http') ? v.link : BASE_URL + v.link}"><div class="thumb-box"><img src="${v.image || 'https://placehold.co/400x225?text=Video+Thumb'}" loading="lazy" onerror="this.src='https://placehold.co/400x225?text=No+Image'"><div class="play-overlay"><i class="fa-solid fa-play"></i></div></div><div class="video-title">${escapeHtml(v.title || 'Untitled')}</div></div>`).join('');
    
    document.querySelectorAll('.video-item').forEach(c => c.addEventListener('click', () => window.open(c.dataset.url, '_blank')));
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredResults.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;
    
    const btn = (t, o, d, a = true) => { 
        let b = document.createElement('button'); 
        b.innerHTML = t; 
        b.className = a ? 'pagination-arrow' : 'pagination-btn'; 
        if (d) b.classList.add('disabled'); 
        b.onclick = o; 
        return b; 
    };
    
    container.appendChild(btn('«', () => { if (currentPageNum > 1) goToPage(1); }, currentPageNum === 1));
    container.appendChild(btn('‹', () => { if (currentPageNum > 1) goToPage(currentPageNum - 1); }, currentPageNum === 1));
    
    let s = 1, e = totalPages;
    if (totalPages > 7) { 
        if (currentPageNum <= 3) { 
            s = 1; 
            e = 5; 
        } else if (currentPageNum >= totalPages - 2) { 
            s = totalPages - 4; 
            e = totalPages; 
        } else { 
            s = currentPageNum - 2; 
            e = currentPageNum + 2; 
        } 
    }
    
    for (let i = s; i <= e; i++) { 
        let pb = document.createElement('button'); 
        pb.innerText = i; 
        pb.className = `pagination-btn ${i === currentPageNum ? 'active' : ''}`; 
        pb.onclick = () => goToPage(i); 
        container.appendChild(pb); 
    }
    
    if (e < totalPages - 1) { 
        let d = document.createElement('span'); 
        d.innerText = '...'; 
        d.className = 'pagination-dots'; 
        container.appendChild(d); 
    }
    
    if (e < totalPages) { 
        let lb = document.createElement('button'); 
        lb.innerText = totalPages; 
        lb.className = `pagination-btn ${totalPages === currentPageNum ? 'active' : ''}`; 
        lb.onclick = () => goToPage(totalPages); 
        container.appendChild(lb); 
    }
    
    container.appendChild(btn('›', () => { if (currentPageNum < totalPages) goToPage(currentPageNum + 1); }, currentPageNum === totalPages));
    container.appendChild(btn('»', () => { if (currentPageNum < totalPages) goToPage(totalPages); }, currentPageNum === totalPages));
}

function goToPage(p) { 
    currentPageNum = p; 
    renderPaginatedGrid(); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function updateInfoBar() { 
    let b = document.getElementById('searchInfoBar'); 
    let t = document.getElementById('resultCountText'); 
    if (currentQuery.trim()) { 
        if (b) b.style.display = 'flex'; 
        if (t) t.innerHTML = `Search results for "${escapeHtml(currentQuery)}" - Found ${currentFilteredResults.length} video${currentFilteredResults.length !== 1 ? 's' : ''}`; 
    } else if (b) b.style.display = 'none'; 
}

function performSearch(q) { 
    let term = q.trim().toLowerCase(); 
    currentQuery = term; 
    currentGenre = "";
    currentPageNum = 1; 
    if (!term) { 
        clearSearch(); 
        return; 
    } 
    currentFilteredResults = allVideos.filter(v => (v.title || "").toLowerCase().includes(term)); 
    renderPaginatedGrid(); 
    updateInfoBar(); 
    window.history.pushState({}, '', `${window.location.pathname}?q=${encodeURIComponent(term)}`); 
}

function clearSearch() { 
    currentQuery = ""; 
    currentGenre = "";
    currentPageNum = 1; 
    currentFilteredResults = [...allVideos]; 
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) searchInput.value = ""; 
    const searchInfoBar = document.getElementById('searchInfoBar');
    if (searchInfoBar) searchInfoBar.style.display = 'none'; 
    renderPaginatedGrid(); 
    window.history.pushState({}, '', window.location.pathname); 
}

// Fungsi untuk menginisialisasi event listener header
function initializeHeaderEvents() {
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.onclick = (e) => { e.preventDefault(); goHome(); };
    }
    
    const navRandom = document.getElementById('navRandom');
    if (navRandom) {
        navRandom.onclick = (e) => { e.preventDefault(); getRandomVideo(); };
    }
    
    const navComic = document.getElementById('navComic');
    if (navComic) {
        navComic.onclick = (e) => { e.preventDefault(); goComic(); };
    }
    
    const navVideo34 = document.getElementById('navVideo34');
    if (navVideo34) {
        navVideo34.onclick = (e) => { e.preventDefault(); openVideo34(); };
    }
    
    const logoClick = document.getElementById('logoClick');
    if (logoClick) {
        logoClick.onclick = () => goHome();
    }
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    
    if (genreBtn && genreDropdown) {
        const newGenreBtn = genreBtn.cloneNode(true);
        genreBtn.parentNode.replaceChild(newGenreBtn, genreBtn);
        
        newGenreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dropdown = document.getElementById('genreDropdown');
            if (dropdown) dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!newGenreBtn.contains(e.target) && !genreDropdown.contains(e.target)) {
                genreDropdown.classList.remove('show');
            }
        });
    }
    
    // ==================== INI SATU-SATUNYA YANG DIUBAH ====================
    const genreLinks = document.querySelectorAll('.genre-dropdown-content a');
    genreLinks.forEach(link => {
        link.removeEventListener('click', link._listener);
        const listener = (e) => {
            e.preventDefault();
            const genre = link.getAttribute('data-genre');
            // REDIRECT KE GENRE.HTML
            window.location.href = `https://allyoulikevideo.neocities.org/genre.html?genre=${encodeURIComponent(genre)}`;
        };
        link._listener = listener;
        link.addEventListener('click', listener);
    });
    // ==================== SAMPAI SINI ====================
}

// Initialize event listeners when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    
    const mainSearchBtn = document.getElementById('mainSearchBtn');
    if (mainSearchBtn) {
        mainSearchBtn.onclick = () => performSearch(document.getElementById('mainSearchInput').value);
    }
    
    const mainSearchInput = document.getElementById('mainSearchInput');
    if (mainSearchInput) {
        mainSearchInput.onkeypress = e => { if (e.key === 'Enter') performSearch(e.target.value); };
    }
    
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.onclick = () => clearSearch();
    }
    
    // Wait for header to load and initialize events
    const checkHeader = setInterval(() => {
        if (document.getElementById('navHome')) {
            clearInterval(checkHeader);
            initializeHeaderEvents();
        }
    }, 100);
});

window.addEventListener('popstate', () => { 
    let q = new URLSearchParams(window.location.search).get('q'); 
    if (q && q.trim()) { 
        const searchInput = document.getElementById('mainSearchInput');
        if (searchInput) searchInput.value = q;
        performSearch(q); 
    } else { 
        clearSearch(); 
    } 
});