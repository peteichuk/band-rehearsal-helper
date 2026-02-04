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
const mainContent = document.getElementById('mainContent');
const loadFromSheetsContainer = document.getElementById('loadFromSheetsContainer');
const backButton = document.getElementById('backButton');
const mainSection = document.getElementById('mainSection');
const filtersSection = document.getElementById('filtersSection');
const printMainContent = document.getElementById('printMainContent');
const reloadButton = document.getElementById('reloadButton');
const loader = document.getElementById('loader');

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

function renderTransposeControls() {
  const transposeContainer = document.querySelector('#transposeContainer');
  if (!transposeContainer) return;

  const DISPLAY_SCALE = [
    'C',
    'C#',
    'Db',
    'D',
    'D#',
    'Eb',
    'E',
    'F',
    'F#',
    'Gb',
    'G',
    'G#',
    'Ab',
    'A',
    'A#',
    'Bb',
    'B',
    'H',
  ];

  // Get the original tonality from the selected song
  const originalTonality = selectedSong?.Tonality || 'C';
  const baseMatch = originalTonality.match(/^([A-GH][#b]?)(.*)$/);
  const baseRoot = baseMatch ? baseMatch[1] : originalTonality;
  const baseSuffix = baseMatch ? baseMatch[2] : '';

  const normalizedBaseRoot = NORMALIZE_MAP[baseRoot] || baseRoot;
  const baseIndexInChords = CHORDS.indexOf(normalizedBaseRoot);

  const urlParams = new URLSearchParams(window.location.search);
  const targetTonalityFromUrl = urlParams.get('tonality');

  let dropdownOptions = DISPLAY_SCALE.map(note => {
    const normalizedNote = NORMALIZE_MAP[note] || note;
    const noteIndex = CHORDS.indexOf(normalizedNote);
    let steps = noteIndex - baseIndexInChords;

    if (steps > 6) steps -= 12;
    if (steps < -6) steps += 12;

    const isSelected =
      note + baseSuffix === targetTonalityFromUrl ||
      (steps === 0 && note === baseRoot && !targetTonalityFromUrl);

    const isOriginal = steps === 0 && note === baseRoot ? ' (Original)' : '';
    const useFlats = note.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(note);

    return `<option value="${steps}" data-use-flats="${useFlats}" ${isSelected ? 'selected' : ''}>${note}${baseSuffix}${isOriginal}</option>`;
  }).join('');

  transposeContainer.innerHTML = `
    <div class="flex items-center justify-center gap-2">
      <button id="transposeDown" class="px-3 py-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 rounded text-white">-</button>
      <div class="select-wrapper text-white">
        <select id="transposeDropdown" class="px-2 py-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 rounded appearance-none pr-6 outline-none">
          ${dropdownOptions}
        </select>
      </div>
      <button id="transposeUp" class="px-3 py-1 bg-blue-600 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 rounded text-white">+</button>
    </div>
  `;

  const dropdown = document.querySelector('#transposeDropdown');
  const transposeDown = document.querySelector('#transposeDown');
  const transposeUp = document.querySelector('#transposeUp');

  function applyTranspose(isManual = true) {
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    if (!selectedOption) return;

    const steps = parseInt(selectedOption.value, 10);
    const useFlats = selectedOption.getAttribute('data-use-flats') === 'true';
    const tonalityName = selectedOption.text.replace(' (Original)', '');

    if (isManual) {
      const url = new URL(window.location);
      if (steps === 0) url.searchParams.delete('tonality');
      else url.searchParams.set('tonality', tonalityName);
      window.history.replaceState({}, '', url);
    }

    window.transposeChordsInSpans(steps, useFlats);
  }

  // Call on init if target tonality is from URL
  if (targetTonalityFromUrl) {
    setTimeout(() => applyTranspose(false), 0);
  }

  dropdown.addEventListener('change', () => applyTranspose(true));
  transposeDown.addEventListener('click', () => {
    if (dropdown.selectedIndex > 0) {
      dropdown.selectedIndex--;
      applyTranspose(true);
    }
  });
  transposeUp.addEventListener('click', () => {
    if (dropdown.selectedIndex < dropdown.options.length - 1) {
      dropdown.selectedIndex++;
      applyTranspose(true);
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
    showLoader();
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
    hideLoader();
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
}

// Filter songs by search query
function filterSongs(query) {
  const searchTerm = query.toLowerCase().trim();
  const url = new URL(window.location);
  if (searchTerm) {
    url.searchParams.set('search', searchTerm);
  } else {
    url.searchParams.delete('search');
    url.hash = '';
    selectedSong = null;
    renderMainContent();
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
    mainContent.innerHTML =
      '<p class="text-gray-500 dark:text-gray-400 text-center py-2">No songs found</p>';
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
        : 'bg-blue-100 dark:bg-gray-800'
    }"
    title="${!song.Text ? 'Text not available for this song' : ''}"
    type="button"
   >
    <div class="font-medium flex w-full gap-2 items-center">
      <span class="flex flex-nowrap items-center gap-1 ${!song.Text ? 'text-red-900 dark:text-red-300 underline decoration-wavy' : ''}">
        ${escapeHtml(song.Name || 'Untitled')} 
        ${song.Text ? '<span class="text-xs text-green-600 dark:text-green-700"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>' : ''}
      </span> 
      ${song.Tonality ? `<span class="text-xs text-blue-600 dark:text-blue-400">${escapeHtml(song.Tonality)}</span>` : ''}
      ${song.BPM ? `<span class="text-xs text-orange-600">${song.BPM}</span>` : ''}
    </div>
    <div class="flex gap-2 justify-between w-full text-xs">
     <p class="flex gap-2">
      ${song.Language ? `<span class="text-gray-500 dark:text-gray-400">${escapeHtml(song.Language)}</span>` : ''}
     </p>
     <p class="flex items-center gap-2">
      ${song.GroupBy ? `<span class="px-2 py-1 bg-purple-300 dark:bg-purple-900 rounded-lg">${escapeHtml(song.GroupBy)}</span>` : ''}
      ${song.Favorites === true ? `<span class="w-[16px] h-[16px] text-yellow-500 dark:text-yellow-400 mt-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path fill="currentColor" d="M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z"/></svg></span>` : ''}
     </p>
    </div>
   </button>
  `;
  });

  mainContent.innerHTML = listItems.join('');

  // Add click handlers
  document.querySelectorAll('#mainContent button, #mobileSongsList button').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-song-index'));
      selectSong(filteredSongs[index]);
    });
  });
}

// Select a song
function selectSong(song, targetTonality = null) {
  selectedSong = song;
  // If targetTonality exists (from URL), we'll use it, otherwise use song's original
  globalTonality = targetTonality || song.Tonality || 'C';
  globalTempo = song.BPM || null;

  const url = new URL(window.location);
  url.hash = encodeURIComponent(song.Name || ''); // Save song name in fragment
  window.history.replaceState({}, '', url);

  renderSongsList();
  renderMainContent();
}

// Add zoom controls
function addZoomControls() {
  const zoomControls = document.getElementById('zoomControls');
  if (!zoomControls) return;

  zoomControls.innerHTML = `
    <div class="flex items-center gap-2">
      <button id="zoomInBtn" class="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-in" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
          <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"/>
        </svg>
      </button>
      <button id="zoomOutBtn" class="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-zoom-out" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"/>
          <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z"/>
          <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"/>
        </svg>
      </button>
      <button id="resetZoomBtn" class="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded flex items-center gap-2" type="button">
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
  backButton.classList.remove('hidden');
  scrollToTop();

  if (text) {
    loadFromSheetsContainer.classList.add('hidden');
    filtersSection.classList.add('hidden');
    printMainContent.classList.remove('hidden');
  } else {
    loadFromSheetsContainer.classList.remove('hidden');
  }

  mainContent.innerHTML = `
  <h2 class="text-2xl font-bold mb-2">${escapeHtml(selectedSong.Name || 'Untitled')} <span class="text-xs text-blue-600 dark:text-blue-400 mb-2">Tonality: <span class="font-semibold">${escapeHtml(selectedSong.Tonality) || '-'}</span></span> <span class="text-xs text-orange-600 mb-2">BPM: <span class="font-semibold">${selectedSong.BPM || '-'}</span></span></h2>

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
    
    <div class="h-100 border border-l-1 border-color-gray-200 dark:border-color-gray-700"></div>
    
    <div id="transposeContainer" class="${text ? '' : 'hidden'}"></div>
  </div>

  ${
    text
      ? `<pre id="songContent" class="whitespace-pre-wrap font-sans text-sm leading-[1.5] text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto">${text}</pre>`
      : getContentMessage(
          'Text not found for this song',
          'The selected song does not have any text available.'
        )
  }
 `;

  addZoomControls();
  colorizeChords();
  renderTransposeControls();
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

function scrollToTop() {
  setTimeout(() => {
    mainSection.scrollTo({ top: 0, behavior: 'smooth' });
  }, 200);
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

// Initialize
initDarkMode();
enableSearch();

// Load songs on page load with default ID
window.addEventListener('DOMContentLoaded', () => {
  const url = new URL(window.location);
  const tableId = url.searchParams.get('tableId');
  const searchQuery = url.searchParams.get('search');
  const fragment = decodeURIComponent(url.hash.slice(1));
  const targetTonality = url.searchParams.get('tonality');

  if (tableId) {
    sheetsIdInput.value = tableId; // Populate input with table ID
    loadSongs().then(() => {
      if (searchQuery) {
        searchInput.value = searchQuery;
        filterSongs(searchQuery); // Filter songs after loading
      }

      if (fragment) {
        const song = songs.find(s => s.Name === fragment);
        if (song) {
          selectSong(song, targetTonality);
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

backButton.addEventListener('click', () => {
  selectedSong = null;
  globalTonality = null;
  globalTempo = null;
  backButton.classList.add('hidden');
  filtersSection.classList.remove('hidden');
  printMainContent.classList.add('hidden');
  renderSongsList();
  scrollToTop();
  // renderMainContent();

  // Clear the hash from the URL
  const url = new URL(window.location);
  url.hash = '';
  url.searchParams.delete('tonality');
  window.history.replaceState({}, '', url);
});

// Reload button
reloadButton.addEventListener('click', () => {
  window.location.reload();
});

function showLoader() {
  loader?.classList.remove('hidden');
}

function hideLoader() {
  loader?.classList.add('hidden');
}
