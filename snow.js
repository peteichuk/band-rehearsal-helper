function createSnow() {
  const container = document.getElementById('snow-container');
  if (!container) return;

  let totalCount = 7;
  if (window.innerWidth > 1200) {
    totalCount = 30;
  } else if (window.innerWidth > 768) {
    totalCount = 12;
  }

  let currentCount = 0;

  function addSnowflake() {
    if (currentCount >= totalCount) return;

    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';

    const size = Math.random() * 4 + 2 + 'px';
    const left = Math.random() * 100 + 'vw';
    const fallDuration = Math.random() * 17 + 7 + 's';
    const swayDuration = Math.random() * 4 + 4 + 's';
    const opacity = Math.random() * 0.5 + 0.3;

    snowflake.style.width = size;
    snowflake.style.height = size;
    snowflake.style.left = left;
    snowflake.style.animationDuration = `${fallDuration}, ${swayDuration}`;
    snowflake.style.opacity = opacity;

    container.appendChild(snowflake);
    currentCount++;

    const randomDelay = Math.random() * (2500 - 500) + 500;
    setTimeout(addSnowflake, randomDelay);
  }

  addSnowflake();
}

window.addEventListener('DOMContentLoaded', createSnow);
