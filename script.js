// Application state
let songs = [];
let filteredSongs = [];
let selectedSong = null;

// Global variables for tonality and tempo
let globalTonality = null;
let globalTempo = null;

// DOM elements
const sheetsIdInput = document.getElementById('sheetsIdInput');
const loadSongsBtn = document.getElementById('loadSongsBtn');
const searchInput = document.getElementById('searchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const songsList = document.getElementById('songsList');
const mobileSongsList = document.getElementById('mobileSongsList');
const mainContent = document.getElementById('mainContent');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileSidebarClose = document.getElementById('mobileSidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileSidebar = document.getElementById('mobileSidebar');
const loadFromSheetsContainer = document.getElementById('loadFromSheetsContainer');

// Initialize dark mode based on system preference
function initDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}

// Load songs from Google Sheets
async function loadSongs() {
  let sheetsId = sheetsIdInput.value.trim();
  if (!sheetsId) {
    alert('Please enter a Google Sheets ID or URL');
    return;
  }

  // Save the table ID in query parameters
  const url = new URL(window.location);
  url.searchParams.set('tableId', sheetsId);
  window.history.replaceState({}, '', url);

  // Extract ID from full URL if provided
  const match = sheetsId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    sheetsId = match[1];
    sheetsIdInput.value = sheetsId; // Replace input with extracted ID
  }

  const urlToFetch =
    `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq` +
    `?tqx=out:json&headers=1&tq=${encodeURIComponent('select *')}`;

  try {
    loadSongsBtn.disabled = true;
    loadSongsBtn.textContent = 'Loading...';

    const response = await fetch(urlToFetch);
    const text = await response.text();
    const data = parseGvizResponse(text);
    songs = normalizeRows(data.table);

    songs = songs
      .filter(song => song.Name)
      .sort((a, b) => a.Name.localeCompare(b.Name))
      .sort((a, b) => (b.Favorites === true ? 1 : 0) - (a.Favorites === true ? 1 : 0));

    filteredSongs = [...songs];
    renderSongsList();
    enableSearch();
  } catch (error) {
    console.error('Error loading songs:', error);
    alert('Failed to load songs. Please check the Google Sheets ID.');
  } finally {
    loadSongsBtn.disabled = false;
    loadSongsBtn.textContent = 'Load';
  }
}

// Parse Google Visualization API response
function parseGvizResponse(text) {
  const jsonText = text
    .replace(/^[^(]*\(/, '') // remove everything before (
    .replace(/\);?$/, ''); // remove ); at the end
  return JSON.parse(jsonText);
}

// Normalize table rows to objects
function normalizeRows(table) {
  const headers = table.cols.map(c => c.label).filter(label => label);
  return table.rows.map(r => {
    const obj = {};
    r.c.forEach((cell, i) => {
      if (cell?.v) {
        obj[headers[i]] = cell?.v ?? null;
      }
    });
    return obj;
  });
}

// Enable search inputs
function enableSearch() {
  const hasSongs = songs.length > 0;
  searchInput.disabled = !hasSongs;
  mobileSearchInput.disabled = !hasSongs;
}

// Filter songs by search query
function filterSongs(query) {
  const searchTerm = query.toLowerCase().trim();
  const url = new URL(window.location);
  if (searchTerm) {
    url.searchParams.set('search', searchTerm);
  } else {
    url.searchParams.delete('search');
    url.hash = ''; // Clear the hash from the URL
    selectedSong = null; // Clear the selected song when the filter is cleared
    renderMainContent(); // Clear the main content
  }
  window.history.replaceState({}, '', url);

  if (!searchTerm) {
    filteredSongs = [...songs];
  } else {
    filteredSongs = songs.filter(song => {
      const songName = (song.Name || '').toLowerCase();
      const songLanguage = (song.Language || '').toLowerCase();
      const songGroupBy = (song.GroupBy || '').toLowerCase();
      return (
        songName.includes(searchTerm) ||
        songLanguage.includes(searchTerm) ||
        songGroupBy.includes(searchTerm)
      );
    });
  }
  renderSongsList();
}

// Render songs list
function renderSongsList() {
  if (filteredSongs.length === 0) {
    songsList.innerHTML =
      '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No songs found</p>';
    mobileSongsList.innerHTML =
      '<p class="text-gray-500 dark:text-gray-400 text-center py-4">No songs found</p>';
    return;
  }

  const listItems = filteredSongs.map((song, index) => {
    const isSelected = selectedSong === song;
    return `
   <button
    data-song-index="${index}"
    class="w-full text-left px-2 py-1 mb-1 rounded  hover:bg-blue-300  dark:hover:bg-gray-700 transition-colors ${
      isSelected
        ? 'bg-blue-300 dark:bg-gray-700 text-blue-900 dark:text-blue-100'
        : 'bg-blue-100 dark:bg-gray-900'
    }"
   >
    <div class="font-medium flex w-full gap-2 items-center"><span class="flex flex-nowrap items-center gap-1">${escapeHtml(song.Name || 'Untitled')} ${song.Text ? '<span class="text-sm text-green-600 dark:text-green-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>' : ''}</span> ${song.Tonality ? `<span class="text-sm text-blue-600 dark:text-blue-400">${escapeHtml(song.Tonality)}</span>` : ''} ${song.BPM ? `<span class="text-sm text-orange-600">${song.BPM}</span>` : ''}</div>
    <div class="flex gap-2 justify-between mt-1 w-full">
     <p class="flex gap-2">
      ${song.Language ? `<span class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(song.Language)}</span>` : ''}
     </p>
     <p class="flex items-center gap-2">
      ${song.GroupBy ? `<span class="text-sm px-2 py-1 bg-purple-300 dark:bg-purple-900 rounded-lg">${escapeHtml(song.GroupBy)}</span>` : ''}
      ${song.Favorites === true ? `<span class="text-sm w-[16px] h-[16px] text-yellow-500 dark:text-yellow-400 mt-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path fill="currentColor" d="M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z"/></svg></span>` : ''}
     </p>
    </div>
   </button>
  `;
  });

  songsList.innerHTML = listItems.join('');
  mobileSongsList.innerHTML = listItems.join('');

  // Add click handlers
  document.querySelectorAll('#songsList button, #mobileSongsList button').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-song-index'));
      selectSong(filteredSongs[index]);
    });
  });
}

// Select a song
function selectSong(song) {
  selectedSong = song;
  globalTonality = song.Tonality || null;
  globalTempo = song.BPM || null;

  const url = new URL(window.location);
  url.hash = encodeURIComponent(song.Name || ''); // Save song name in fragment
  window.history.replaceState({}, '', url);

  renderSongsList();
  renderMainContent();
  closeMobileSidebar();
}

// Add zoom controls
function addZoomControls() {
  const zoomControls = document.getElementById('zoomControls');
  if (!zoomControls) return;

  zoomControls.innerHTML = `
    <div class="flex items-center gap-2">
      <button id="zoomInBtn" class="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
          <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
        </svg>
      </button>
      <button id="zoomOutBtn" class="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
          <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
        </svg>
      </button>
      <button id="resetZoomBtn" class="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        Reset
      </button>
    </div>
  `;

  const songContent = document.getElementById('songContent');
  if (!songContent) return;

  const songContentFontSize = Number.parseInt(localStorage.getItem('songContentFontSize') || 16);
  let currentFontSize =
    !isNaN(songContentFontSize) && songContentFontSize ? songContentFontSize : 16; // Default font size in pixels

  document.getElementById('zoomInBtn').addEventListener('click', () => {
    currentFontSize += 2;
    songContent.style.fontSize = `${currentFontSize}px`;
    localStorage.setItem('songContentFontSize', currentFontSize);
  });

  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    currentFontSize = Math.max(6, currentFontSize - 2); // Minimum font size of 10px
    songContent.style.fontSize = `${currentFontSize}px`;
    localStorage.setItem('songContentFontSize', currentFontSize);
  });

  document.getElementById('resetZoomBtn').addEventListener('click', () => {
    currentFontSize = 16; // Reset to default font size
    songContent.style.fontSize = `${currentFontSize}px`;
    localStorage.setItem('songContentFontSize', currentFontSize);
  });

  songContent.style.fontSize = `${currentFontSize}px`;
  localStorage.setItem('songContentFontSize', currentFontSize);
}

function getContentMessage(title, message) {
  return `
   <div class="text-center py-12">
    <h2 class="text-2xl font-semibold mb-2">${title}</h2>
    <p class="text-gray-500 dark:text-gray-400">${message}</p>
   </div>
  `;
}

// Render main content
function renderMainContent() {
  if (!selectedSong) {
    mainContent.innerHTML = getContentMessage(
      'No song selected',
      'Select a song from the sidebar to view details'
    );

    loadFromSheetsContainer.classList.remove('hidden');
    return;
  }

  const youtubeUrl = selectedSong.YouTube || '';
  const chordifyUrl = selectedSong.Chordify || '';
  const holychordsUrl = selectedSong.Holychords || '';
  const text = selectedSong.Text || '';

  if (text) {
    loadFromSheetsContainer.classList.add('hidden');
  } else {
    loadFromSheetsContainer.classList.remove('hidden');
  }

  mainContent.innerHTML = `
  <div class="py-4">
   <h2 class="text-3xl font-bold mb-2">${escapeHtml(selectedSong.Name || 'Untitled')} <span class="text-lg text-blue-600 dark:text-blue-400 mb-2">Tonality: <span class="font-semibold">${escapeHtml(selectedSong.Tonality) || '-'}</span></span> <span class="text-lg text-orange-600 mb-2">BPM: <span class="font-semibold">${selectedSong.BPM || '-'}</span></span></h2>

   <div class="flex flex-wrap gap-3 mb-4">
    ${
      youtubeUrl
        ? `
     <a
      href="${escapeHtml(youtubeUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      title="Watch on YouTube"
      class="px-2 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
     >
       <img src="images/icons/youtube.svg" alt="YouTube" class="w-5 h-5"/>
     </a>
    `
        : ''
    }
    
    ${
      holychordsUrl
        ? `
     <a
      href="${escapeHtml(holychordsUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      title="View on HolyChords"
      class="px-2 py-1 bg-[#26ad92] hover:bg-[#50bf5a] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
     >
       <img src="images/icons/holychords.svg" alt="HolyChords" class="w-5 h-5"/>
     </a>
    `
        : ''
    }
    
    ${
      chordifyUrl
        ? `
     <a
      href="${escapeHtml(chordifyUrl)}"
      target="_blank"
      rel="noopener noreferrer"
      title="View on Chordify"
      class="px-2 py-1 bg-[#0A8282] hover:bg-[#10bbbb] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
     >
       <img src="images/icons/chordify.svg" alt="Chordify" class="w-5 h-5"/>
     </a>
    `
        : ''
    }

    <div id="zoomControls" class="${text ? '' : 'hidden'}"></div>
   </div>

   ${
     text
       ? `<pre id="songContent" class="whitespace-pre-wrap font-sans text-sm leading-[1.5] text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto">${text}</pre>`
       : getContentMessage(
           'Text not found for this song',
           'The selected song does not have any text available.'
         )
   }
  </div>
 `;

  addZoomControls();
  colorizeChords();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text && typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Colorize chords in the text
function colorizeChords() {
  const preTag = document.querySelector('#songContent');
  if (!preTag) return;

  const chordPattern =
    /(^|\s)([A-GH][#b]?(?:m|maj|dim|aug|sus\d?|[2456789]|11|13)*(?:\/[A-GH][#b]?(?:m|maj|dim|aug|sus\d?|[2456789]|11|13)*)*)(?=\s|$)/g;

  const content = preTag.textContent;

  preTag.innerHTML = content.replace(chordPattern, (match, p1, p2) => {
    return `${p1}<span class="chord text-blue-600 dark:text-blue-400" data-chord="${p2}">${p2}</span>`;
  });
}

// Sidebar toggle for mobile
function openMobileSidebar() {
  mobileSidebar.classList.remove('-translate-x-full');
  sidebarOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  mobileSidebar.classList.add('-translate-x-full');
  sidebarOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Event listeners
loadSongsBtn.addEventListener('click', loadSongs);

sheetsIdInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    loadSongs();
  }
});

searchInput.addEventListener('input', e => {
  filterSongs(e.target.value);
});

mobileSearchInput.addEventListener('input', e => {
  filterSongs(e.target.value);
});

sidebarToggle.addEventListener('click', openMobileSidebar);
mobileSidebarClose.addEventListener('click', closeMobileSidebar);
sidebarOverlay.addEventListener('click', closeMobileSidebar);

// Initialize
initDarkMode();
enableSearch();

// Load songs on page load with default ID
window.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location);
  const tableId = url.searchParams.get('tableId');
  const searchQuery = url.searchParams.get('search');
  const fragment = decodeURIComponent(url.hash.slice(1));

  if (tableId) {
    sheetsIdInput.value = tableId; // Populate input with table ID
    loadSongs().then(() => {
      if (searchQuery) {
        searchInput.value = searchQuery;
        mobileSearchInput.value = searchQuery;
        filterSongs(searchQuery); // Filter songs after loading
      }
      if (fragment) {
        const song = songs.find(s => s.Name === fragment);
        if (song) {
          selectSong(song);
        }
      }
    });
  } else {
    // Show default message if no table ID is provided
    mainContent.innerHTML = getContentMessage(
      'No table ID provided',
      'Please enter a Google Sheets ID or URL to load songs.'
    );
  }
});

// Clear search input
document.getElementById('clearSearchInput').addEventListener('click', () => {
  searchInput.value = '';
  filterSongs('');
});

// Clear mobile search input
document.getElementById('clearMobileSearchInput').addEventListener('click', () => {
  mobileSearchInput.value = '';
  filterSongs('');
});
