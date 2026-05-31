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
let currentGenre = "All";
let currentFilteredByGenre = [];
const itemsPerPage = 12;

// ==================== BACA GENRE DARI URL ====================
function getGenreFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('genre');
}

// ==================== HAPUS PARAMETER URL ====================
function removeGenreParamFromURL() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('genre')) {
        url.searchParams.delete('genre');
        window.history.replaceState({}, '', url.toString());
    }
}

// ==================== SIMPAN & BACA GENRE DARI LOCALSTORAGE ====================
function saveGenreToLocalStorage(genre) {
    localStorage.setItem('selectedGenre', genre);
}

function getGenreFromLocalStorage() {
    return localStorage.getItem('selectedGenre');
}

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

function renderVideoGrid(videoArray, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";
    
    if (!videoArray || videoArray.length === 0) {
        grid.innerHTML = '<div class="no-data-message">🎬 No videos in this genre.</div>';
        return;
    }
    
    for (let i = 0; i < videoArray.length; i++) {
        const video = videoArray[i];
        let link = video.link.startsWith('http') ? video.link : BASE_URL + video.link;
        let imgUrl = video.image || "https://placehold.co/600x400?text=Video+Thumb";
        let title = video.title || "Untitled Video";
        
        grid.innerHTML += `
            <div class="video-item" data-url="${link}">
                <div class="video-thumb-container">
                    <img src="${imgUrl}" class="video-thumb" loading="lazy" 
                         onerror="this.src='https://placehold.co/600x400?text=Video+Unavailable'">
                    <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                </div>
                <div class="video-title">${escapeHtml(title)}</div>
            </div>
        `;
    }
    
    document.querySelectorAll(`#${gridId} .video-item`).forEach(card => {
        card.addEventListener('click', () => {
            const url = card.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });
}

function renderPaginatedGrid() {
    const start = (currentPageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = currentFilteredByGenre.slice(start, end);
    renderVideoGrid(paginatedData, 'new-videos-grid');
}

function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredByGenre.length / itemsPerPage);
    if (totalPages <= 1) return;
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹ Prev';
    prevBtn.className = 'pagination-arrow';
    if (currentPageNum === 1) prevBtn.classList.add('disabled');
    prevBtn.onclick = () => {
        if (currentPageNum > 1) {
            currentPageNum--;
            renderPaginatedGrid();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    container.appendChild(prevBtn);
    
    let startPage = Math.max(1, currentPageNum - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.innerText = '1';
        firstBtn.className = 'pagination-btn';
        firstBtn.onclick = () => { currentPageNum = 1; renderPaginatedGrid(); updatePagination(); window.scrollTo({ top: 0 }); };
        container.appendChild(firstBtn);
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'pagination-dots';
            container.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `pagination-btn ${i === currentPageNum ? 'active' : ''}`;
        btn.onclick = () => {
            currentPageNum = i;
            renderPaginatedGrid();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        container.appendChild(btn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.innerText = '...';
            dots.className = 'pagination-dots';
            container.appendChild(dots);
        }
        const lastBtn = document.createElement('button');
        lastBtn.innerText = totalPages;
        lastBtn.className = 'pagination-btn';
        lastBtn.onclick = () => { currentPageNum = totalPages; renderPaginatedGrid(); updatePagination(); window.scrollTo({ top: 0 }); };
        container.appendChild(lastBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next ›';
    nextBtn.className = 'pagination-arrow';
    if (currentPageNum === totalPages) nextBtn.classList.add('disabled');
    nextBtn.onclick = () => {
        if (currentPageNum < totalPages) {
            currentPageNum++;
            renderPaginatedGrid();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    container.appendChild(nextBtn);
}

// ==================== FUNGSI FILTER GENRE ====================
function filterByGenre(genre) {
    currentGenre = genre;
    currentPageNum = 1;
    
    if (!genre || genre === "All") {
        currentFilteredByGenre = [...allVideos];
        saveGenreToLocalStorage('All');
    } else {
        currentFilteredByGenre = allVideos.filter(video => {
            const videoGenre = (video.genre || "").toLowerCase();
            const searchGenre = genre.toLowerCase();
            return videoGenre.includes(searchGenre);
        });
        saveGenreToLocalStorage(genre);
    }
    
    // Update judul
    const newUploadsTitle = document.getElementById('newUploadsTitle');
    if (newUploadsTitle) {
        if (genre && genre !== "All") {
            newUploadsTitle.innerHTML = `Genre: ${genre}`;
        } else {
            newUploadsTitle.innerHTML = `New Uploads`;
        }
    }
    
    renderPaginatedGrid();
    updatePagination();
}

// ==================== ATTACH HEADER EVENTS ====================
function attachHeaderEvents() {
    const searchDesktopBtn = document.getElementById('searchBtnDesktop');
    const searchDesktopInput = document.getElementById('searchInputDesktop');
    if (searchDesktopBtn && searchDesktopInput) {
        searchDesktopBtn.onclick = () => {
            const query = searchDesktopInput.value;
            if (query.trim()) {
                window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
            }
        };
        searchDesktopInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query.trim()) {
                    window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(query.trim())}`;
                }
            }
        };
    }
    
    const mobileIcon = document.getElementById('searchIconMobile');
    const mobileOverlay = document.getElementById('mobileSearchOverlay');
    const closeSearch = document.getElementById('closeSearchBtn');
    const mobileSearchBtn = document.getElementById('searchBtnMobile');
    const mobileSearchInput = document.getElementById('searchInputMobile');
    
    if (mobileIcon && mobileOverlay) {
        mobileIcon.onclick = () => { mobileOverlay.style.display = 'flex'; };
    }
    if (closeSearch && mobileOverlay) {
        closeSearch.onclick = () => { mobileOverlay.style.display = 'none'; };
    }
    if (mobileSearchBtn && mobileSearchInput && mobileOverlay) {
        mobileSearchBtn.onclick = () => {
            const q = mobileSearchInput.value.trim();
            mobileOverlay.style.display = 'none';
            if (q) window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(q)}`;
        };
        mobileSearchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                const q = e.target.value.trim();
                mobileOverlay.style.display = 'none';
                if (q) window.location.href = `${SEARCH_PAGE_URL}?q=${encodeURIComponent(q)}`;
            }
        };
    }
    
    const navHome = document.getElementById('navHome');
    const navRandom = document.getElementById('navRandom');
    const navComic = document.getElementById('navComic');
    const navVideo34 = document.getElementById('navVideo34');
    const logoElem = document.getElementById('logoClick');
    
    if (navHome) navHome.onclick = (e) => { e.preventDefault(); window.location.href = HOME_URL; };
    if (navRandom) {
        navRandom.onclick = (e) => { 
            e.preventDefault(); 
            if (allVideos.length) {
                const randomIndex = Math.floor(Math.random() * allVideos.length);
                const randomItem = allVideos[randomIndex];
                let targetLink = randomItem.link.startsWith('http') ? randomItem.link : BASE_URL + randomItem.link;
                window.open(targetLink, '_blank');
            }
        };
    }
    if (navComic) navComic.onclick = (e) => { e.preventDefault(); window.location.href = COMIC_URL; };
    if (navVideo34) navVideo34.onclick = (e) => { e.preventDefault(); window.open(VIDEO34_URL, '_blank'); };
    if (logoElem) logoElem.onclick = () => { window.location.href = HOME_URL; };
    
    const genreBtn = document.getElementById('navGenre');
    const genreDropdown = document.getElementById('genreDropdown');
    
    if (genreBtn && genreDropdown) {
        genreBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            genreDropdown.classList.toggle('show');
        };
        
        const genreItems = genreDropdown.querySelectorAll('a');
        genreItems.forEach(item => {
            item.onclick = (e) => {
                e.preventDefault();
                const genre = item.getAttribute('data-genre');
                if (genre) {
                    filterByGenre(genre);
                }
                genreDropdown.classList.remove('show');
                
                genreItems.forEach(a => {
                    a.style.background = '';
                    a.style.color = '';
                });
                item.style.background = '#ff3b6f';
                item.style.color = 'white';
            };
        });
    }
    
    document.addEventListener('click', function(e) {
        if (genreDropdown && genreBtn) {
            if (!genreBtn.contains(e.target) && !genreDropdown.contains(e.target)) {
                genreDropdown.classList.remove('show');
            }
        }
    });
}

// ==================== LOAD DATA ====================
async function loadHeader() {
    try {
        const response = await fetch('genre-header.html');
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
        const newGrid = document.getElementById('new-videos-grid');
        if (newGrid) newGrid.innerHTML = '<div class="no-data-message"><i class="fa-solid fa-spinner fa-pulse"></i> Loading...</div>';
        
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        let pages = data.pages || [];
        
        allVideos = pages.map((item) => ({
            title: item.title || "Untitled",
            link: item.link || "#",
            image: item.image || "https://placehold.co/600x400?text=No+Image",
            genre: item.genre || "",
            date: item.date || ""
        }));
        
        const uniqueLinks = new Map();
        allVideos.forEach(video => {
            if (!uniqueLinks.has(video.link)) {
                uniqueLinks.set(video.link, video);
            }
        });
        allVideos = Array.from(uniqueLinks.values());
        
        console.log('Total video unik:', allVideos.length);
        
        // CEK GENRE DARI URL ATAU LOCALSTORAGE
        const genreFromURL = getGenreFromURL();
        const genreFromStorage = getGenreFromLocalStorage();
        
        if (genreFromURL && genreFromURL !== "All") {
            filterByGenre(genreFromURL);
            removeGenreParamFromURL();
        } else if (genreFromStorage && genreFromStorage !== "All") {
            filterByGenre(genreFromStorage);
        } else {
            currentFilteredByGenre = [...allVideos];
            currentGenre = "All";
            currentPageNum = 1;
            renderPaginatedGrid();
            updatePagination();
        }
        
    } catch (err) {
        console.error('Error:', err);
        const newGrid = document.getElementById('new-videos-grid');
        if (newGrid) newGrid.innerHTML = `<div class="no-data-message">❌ Error: ${err.message}</div>`;
    }
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadFooter();
    loadVideoData();
});