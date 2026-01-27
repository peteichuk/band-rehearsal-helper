const metronomeIframeContainer = document.getElementById('metronomeIframeContainer');
const metronomeToggle = document.getElementById('metronomeToggle');
const metronomeModal = document.getElementById('metronomeModal');
const metronomeModalOverlay = document.getElementById('metronomeModalOverlay');
const closeMetronome = document.getElementById('closeMetronome');

metronomeToggle.addEventListener('click', () => {
  if (globalTempo) {
    const metronomeIframe = document.getElementById('metronomeIframe');
    if (
      metronomeIframe &&
      Number.parseInt(metronomeIframe.getAttribute('data-tempo')) != globalTempo
    ) {
      initializeMetronome();
    }
  }

  metronomeModal.classList.remove('hidden');
});

metronomeModalOverlay.addEventListener('click', () => {
    metronomeModal.classList.add('hidden');
});

closeMetronome.addEventListener('click', () => {
  metronomeModal.classList.add('hidden');
});

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initializeMetronome() {
  const theme = getSystemTheme();
  const iframe = `<iframe
          id="metronomeIframe"
          src="https://guitarapp.com/metronome.html?embed=true&tempo=${globalTempo || 120}&timeSignature=2&pattern=1&theme=${theme}"
          title="Online Metronome"
          style="width: 360px; height: 520px; border-style: none; border-radius: 4px;"
          data-tempo="${globalTempo || 120}"
        ></iframe>`;
  metronomeIframeContainer.innerHTML = iframe;
}

window.addEventListener('DOMContentLoaded', () => {
  initializeMetronome();
});
