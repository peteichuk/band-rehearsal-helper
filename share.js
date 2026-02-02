const shareButton = document.getElementById('shareButton');
const shareModal = document.getElementById('shareModal');
const shareModalOverlay = document.getElementById('shareModalOverlay');
const closeShareModal = document.getElementById('closeShareModal');
const shareModalTitle = document.getElementById('shareModalTitle');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyShareLinkButton = document.getElementById('copyShareLinkButton');
const tgShareButton = document.getElementById('tgShareButton');
const whatsAppShareButton = document.getElementById('whatsAppShareButton');

window.addEventListener('DOMContentLoaded', () => {
  shareButton.addEventListener('click', () => {
    const shareUrl = window.location.href;
    shareModalTitle.textContent = selectedSong?.Name || 'Share this link:';
    shareLinkInput.value = shareUrl;
    shareModal.classList.remove('hidden');
  });

  shareModalOverlay.addEventListener('click', () => {
    shareModal.classList.add('hidden');
  });

  closeShareModal.addEventListener('click', () => {
    shareModal.classList.add('hidden');
  });

  copyShareLinkButton.addEventListener('click', () => {
    shareLinkInput.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
    shareModal.classList.add('hidden');
  });

  tgShareButton.addEventListener('click', () => {
    const shareUrl = window.location.href;
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${selectedSong?.Name || 'Band Rehearsal helper app'}`;
    const openedWindow = window.open(tgShareUrl, '_blank');

    setTimeout(() => {
      openedWindow.close();
    }, 10000);
  });

  whatsAppShareButton.addEventListener('click', () => {
    const shareUrl = window.location.href;
    const message = selectedSong?.Name || 'Band Rehearsal helper app';
    const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + shareUrl)}`;
    const openedWindow = window.open(waShareUrl, '_blank');

    setTimeout(() => {
      openedWindow.close();
    }, 10000);
  });
});
