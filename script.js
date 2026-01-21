// Application state
let songs = [];
let filteredSongs = [];
let selectedSong = null;
let isParsingHolychords = false;

// Cache for parsed Holychords songs (clears on page reload)
const holychordsCache = {};

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
  const sheetsId = sheetsIdInput.value.trim();
  if (!sheetsId) {
    alert('Please enter a Google Sheets ID');
    return;
  }

  const url =
    `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq` +
    `?tqx=out:json&headers=1&tq=${encodeURIComponent('select *')}`;

  try {
    loadSongsBtn.disabled = true;
    loadSongsBtn.textContent = 'Loading...';

    const response = await fetch(url);
    const text = await response.text();
    const data = parseGvizResponse(text);
    songs = normalizeRows(data.table);

    // Filter out rows where Name is empty or null
    songs = songs
      .filter(song => song.Name)
      .sort((a, b) => {
        let x = a.Name.toLowerCase();
        let y = b.Name.toLowerCase();
        if (x < y) {
          return -1;
        }
        if (x > y) {
          return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        // Sort favorites to the top
        const aFav = a.Favorites === true ? 1 : 0;
        const bFav = b.Favorites === true ? 1 : 0;
        return bFav - aFav;
      });

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
				class="w-full text-left px-2 py-1 mb-1 rounded bg-blue-100 hover:bg-blue-300 dark:bg-gray-900 dark:hover:bg-gray-700 transition-colors ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
        }"
			>
				<div class="font-medium flex w-full gap-2 items-center"><span>${escapeHtml(song.Name || 'Untitled')}</span> <span class="text-sm text-gray-500 dark:text-gray-400">${song.Tonality ? escapeHtml(song.Tonality) : ''}</span></div>
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
  renderSongsList();
  renderMainContent();
  closeMobileSidebar();
}

// Chord transposition mapping
const chordTranspositions = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  H: 11,
};

const noteNames = [
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

// Transpose a single chord
function transposeChord(chord, semitones) {
  if (!chord || !chord.trim()) return chord;

  const chordMatch = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!chordMatch) return chord;

  const rootNote = chordMatch[1];
  const suffix = chordMatch[2];

  const fromIndex = chordTranspositions[rootNote];
  if (fromIndex === undefined) return chord;

  const toIndex = (fromIndex + semitones + 12) % 12;

  // Find the note name at the target index (prefer sharps for ascending, flats for descending)
  const targetNotes = noteNames.filter(n => chordTranspositions[n] === toIndex);
  const targetNote = targetNotes.length > 0 ? targetNotes[0] : rootNote;

  return targetNote + suffix;
}

// Transpose all chords in song text
function transposeSongContent(content, fromTonality, toTonality) {
  if (!fromTonality || !toTonality || fromTonality === toTonality) {
    return content;
  }

  const fromIndex = chordTranspositions[fromTonality];
  const toIndex = chordTranspositions[toTonality];

  if (fromIndex === undefined || toIndex === undefined) {
    return content;
  }

  const semitones = (toIndex - fromIndex + 12) % 12;

  // Match chord patterns - chords typically appear at start of line or after whitespace
  // Pattern: Note (A-G with optional #/b) + chord quality (m, 7, sus4, etc.) + optional slash chord
  const chordPattern = /(^|[ \t]+)([A-G][#b]?[^/\s]*(?:\/[A-G][#b]?[^/\s]*)?)/gm;

  return content.replace(chordPattern, (match, prefix, chord) => {
    // Handle slash chords (e.g., D/F#)
    if (chord.includes('/')) {
      const parts = chord.split('/');
      const transposedChord = transposeChord(parts[0], semitones);
      const transposedBass = transposeChord(parts[1], semitones);
      return prefix + transposedChord + '/' + transposedBass;
    }

    // Regular chord
    return prefix + transposeChord(chord, semitones);
  });
}

// Parse song from Holychords URL
async function parseHolychords(url, tonality) {
  const holychordsContent = document.getElementById('holychordsContent');

  if (!url || !url.includes('holychords.pro')) {
    alert('Invalid Holychords URL');
    return;
  }

  // Always use base URL (no tonality hash) - tonality is handled client-side
  const baseUrl = url.split('#')[0];

  // Cache key is just the base URL (no tonality)
  const cacheKey = baseUrl;

  // Check cache first
  if (holychordsCache[cacheKey]) {
    const cachedData = holychordsCache[cacheKey];
    // Reset button state if it exists (for cached responses)
    const parseBtn = document.getElementById('parseHolychordsBtn');
    if (parseBtn) {
      parseBtn.disabled = true;
      parseBtn.innerHTML = `
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
				Parse Song
			`;
    }
    const originalTonality = selectedSong ? selectedSong.Tonality : '';
    // Transpose chords if tonality is different from original
    const contentToDisplay = transposeSongContent(
      cachedData.formattedContent,
      cachedData.originalTonality || originalTonality,
      tonality || cachedData.originalTonality || originalTonality
    );
    displayHolychordsContent(contentToDisplay, tonality, url, originalTonality);
    return;
  }

  // Set parsing state and show loading indicator
  isParsingHolychords = true;
  const holychordsContentEl = document.getElementById('holychordsContent');
  if (holychordsContentEl) {
    holychordsContentEl.innerHTML = `
			<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-center py-4">
					<svg class="animate-spin w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span class="ml-3 text-gray-700 dark:text-gray-300">Parsing song...</span>
				</div>
			</div>
		`;
  }

  const parseBtn = document.getElementById('parseHolychordsBtn');
  if (parseBtn) {
    parseBtn.disabled = true;
    parseBtn.innerHTML = `
			<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			Parsing...
		`;
  }

  try {
    // Always use base URL (without tonality hash) - tonality is handled client-side
    // Use CORS proxy to bypass CORS restrictions
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;

    const response = await fetch(proxyUrl);
    const html = await response.text();

    // Parse HTML to extract song content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Holychords uses pre#music_text for the song content with chords
    let songContent = '';

    // First, try the specific Holychords selector
    const musicTextElement = doc.querySelector('pre#music_text');
    if (musicTextElement) {
      songContent = musicTextElement.textContent.trim();
    }

    // If not found, try alternative selectors
    if (!songContent) {
      const contentSelectors = [
        'pre.music_text',
        'pre[class*="music"]',
        '[class*="song-content"]',
        '[class*="chords-text"]',
        '[class*="lyrics"]',
        'pre[class*="chord"]',
        'pre',
      ];

      for (const selector of contentSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          // Check if content looks like song with chords
          if (text && (text.length > 100 || text.match(/[A-G][#b]?[m]?/))) {
            songContent = text;
            break;
          }
        }
      }
    }

    // If no specific container found, try to get main content from body
    if (!songContent && doc.body) {
      // Clone body to avoid modifying original
      const bodyClone = doc.body.cloneNode(true);

      // Remove non-content elements
      const toRemove = bodyClone.querySelectorAll(
        'script, style, nav, header, footer, aside, .header, .footer, .navbar, .menu, .sidebar'
      );
      toRemove.forEach(el => el.remove());

      const bodyText = bodyClone.textContent.trim();
      if (bodyText) {
        songContent = bodyText;
      }
    }

    // Preserve original formatting with newlines
    // Only remove excessive trailing spaces but keep all newlines
    const formattedContent = songContent
      .split('\n')
      .map(line => line.trimEnd()) // Remove trailing spaces but keep leading ones
      .join('\n'); // Preserve all newlines including empty lines for spacing between sections

    // Get original tonality from song data
    const originalTonality = selectedSong ? selectedSong.Tonality : '';

    // Store in cache with original tonality (base URL only, no tonality in cache key)
    holychordsCache[cacheKey] = {
      formattedContent: formattedContent,
      originalTonality: originalTonality,
    };

    // Transpose chords if tonality is different from original
    const contentToDisplay = transposeSongContent(
      formattedContent,
      originalTonality,
      tonality || originalTonality
    );

    // Display the parsed content
    isParsingHolychords = false;
    displayHolychordsContent(contentToDisplay, tonality || originalTonality, url, originalTonality);
  } catch (error) {
    isParsingHolychords = false;
    console.error('Error parsing Holychords:', error);
    const holychordsContentEl = document.getElementById('holychordsContent');
    if (holychordsContentEl) {
      holychordsContentEl.innerHTML = `
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
					<p class="text-red-800 dark:text-red-200">Failed to parse song from Holychords. Please check the URL and try again.</p>
					<p class="text-red-600 dark:text-red-300 text-sm mt-2">Error: ${escapeHtml(error.message)}</p>
				</div>
			`;
    }
  } finally {
    // Reset button state after parsing completes (keep it disabled)
    const parseBtn = document.getElementById('parseHolychordsBtn');
    if (parseBtn && parseBtn.disabled) {
      parseBtn.innerHTML = `
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
				</svg>
				Parse Song
			`;
    }
  }
}

// Display Holychords content with tonality selector
function displayHolychordsContent(formattedContent, tonality, url, originalTonality) {
  const holychordsContent = document.getElementById('holychordsContent');

  // Clear any existing content first - force complete replacement
  if (holychordsContent) {
    holychordsContent.innerHTML = '';
    // Force a reflow to ensure old content is cleared
    holychordsContent.offsetHeight;
  }

  // Tonality options matching Holychords format
  const tonalities = [
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
    'H',
  ];

  // Use original tonality from song data for "(Original)" label
  const originalTonalityValue =
    originalTonality || (selectedSong ? selectedSong.Tonality : '') || '';
  // Use current tonality for selected option in dropdown
  const currentTonality = tonality || '';

  // Display the parsed content with tonality selector
  holychordsContent.innerHTML = `
			<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-300 dark:border-gray-700">
				<div class="flex items-center justify-between mb-4 flex-wrap gap-3">
					<h3 class="text-xl font-semibold">Song Text from Holychords</h3>
					<div class="flex items-center gap-2">
						<label for="tonalitySelect" class="text-sm font-medium">Tonality:</label>
						<select 
							id="tonalitySelect"
							class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
						>
							<option value="">Default</option>
							${tonalities
                .map(t => {
                  const isOriginal = originalTonalityValue === t;
                  const isSelected = currentTonality === t;
                  const label = isOriginal ? `${t} (Original)` : t;
                  return `<option value="${escapeHtml(t)}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
                })
                .join('')}
						</select>
						<button 
							id="applyTonalityBtn"
							class="px-2 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded font-medium transition-colors text-sm"
						>
							Apply
						</button>
					</div>
				</div>
				<pre class="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-600 overflow-x-auto">${escapeHtml(formattedContent)}</pre>
			</div>
		`;

  // Add event listener for tonality change
  const applyTonalityBtn = document.getElementById('applyTonalityBtn');
  const tonalitySelect = document.getElementById('tonalitySelect');

  if (applyTonalityBtn && tonalitySelect && url) {
    // Store base URL (without hash) for reuse
    const baseUrl = url.split('#')[0];

    const applyTonality = () => {
      const newTonality = tonalitySelect.value || originalTonalityValue;
      // Just re-display with transposed chords (no new request needed)
      const cacheKey = baseUrl.split('#')[0];
      if (holychordsCache[cacheKey]) {
        const cachedData = holychordsCache[cacheKey];
        const transposedContent = transposeSongContent(
          cachedData.formattedContent,
          cachedData.originalTonality || originalTonalityValue,
          newTonality
        );
        displayHolychordsContent(transposedContent, newTonality, baseUrl, originalTonalityValue);
      } else {
        // If not cached, parse it
        parseHolychords(baseUrl, newTonality);
      }
    };

    applyTonalityBtn.addEventListener('click', applyTonality);
    tonalitySelect.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        applyTonality();
      }
    });
  }
}

// Render main content
function renderMainContent() {
  if (!selectedSong) {
    mainContent.innerHTML = `
			<div class="text-center py-12">
				<h2 class="text-2xl font-semibold mb-2">No song selected</h2>
				<p class="text-gray-500 dark:text-gray-400">Select a song from the sidebar to view details</p>
			</div>
		`;
    return;
  }

  const youtubeUrl = selectedSong.YouTube || '';
  const chordifyUrl = selectedSong.Chordify || '';
  const holychordsUrl = selectedSong.Holychords || '';
  const text = selectedSong.Text || '';

  mainContent.innerHTML = `
		<div class="py-4">
			<h2 class="text-3xl font-bold mb-2">${escapeHtml(selectedSong.Name || 'Untitled')} ${selectedSong.Tonality ? `<span class="text-lg text-gray-600 dark:text-gray-300 mb-2">Tonality: <span class="font-semibold">${escapeHtml(selectedSong.Tonality)}</span></span>` : ''}</h2>
			
			<div class="flex flex-wrap gap-3 mb-4">
				${
          youtubeUrl
            ? `
					<a 
						href="${escapeHtml(youtubeUrl)}" 
						target="_blank" 
						rel="noopener noreferrer"
						class="px-2 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
						YouTube
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
						class="px-2 py-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
						</svg>
						Chordify
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
						class="px-2 py-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						Holychords
					</a>
					<button 
						id="parseHolychordsBtn"
						class="px-2 py-1 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
						</svg>
						Parse Song
					</button>
				`
            : ''
        }
				<div id="zoomControls"></div>
			</div>

			<div id="holychordsContent" class="mt-8 text-xs"></div>
		</div>
	`;

  // Clear Holychords content when selecting a new song
  const holychordsContent = document.getElementById('holychordsContent');
  if (holychordsContent) {
    holychordsContent.innerHTML = '';
    holychordsContent.innerHTML = `<pre>${text}</pre>` || '';
  }

  // Add event listener for parse button
  if (holychordsUrl) {
    const parseBtn = document.getElementById('parseHolychordsBtn');
    if (parseBtn) {
      // Use base URL (remove any existing hash) so we can properly add tonality
      const baseUrl = holychordsUrl.split('#')[0];
      parseBtn.addEventListener('click', () => parseHolychords(baseUrl, selectedSong.Tonality));
    }
  }

  // Add zoom buttons to the Holychords content section
  function addZoomButtons() {
    const holychordsContent = document.getElementById('holychordsContent');
    const zoomControlsContent = document.getElementById('zoomControls');
    if (!holychordsContent) return;

    const zoomControls = document.createElement('div');
    zoomControls.className = 'flex gap-2 mb-4';

    zoomControls.innerHTML = `
    <button id="zoomInBtn" class="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors">
      Zoom In
    </button>
    <button id="zoomOutBtn" class="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors">
      Zoom Out
    </button>
  `;

    zoomControlsContent.insertAdjacentElement('beforebegin', zoomControls);

    // Default font size
    let fontSize = 14;

    // Zoom in functionality
    document.getElementById('zoomInBtn').addEventListener('click', () => {
      fontSize += 2;
      holychordsContent.style.fontSize = `${fontSize}px`;
      holychordsContent.style.lineHeight = 'normal';
    });

    // Zoom out functionality
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
      fontSize = Math.max(10, fontSize - 2); // Prevent font size from going below 10px
      holychordsContent.style.fontSize = `${fontSize}px`;
      holychordsContent.style.lineHeight = 'normal';
    });
  }

  // Call the function after rendering Holychords content
  addZoomButtons();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
  if (sheetsIdInput.value) {
    loadSongs();
  }
});
