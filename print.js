window.addEventListener('DOMContentLoaded', () => {
  const printMainContent = document.getElementById('printMainContent');

  if (!printMainContent) return;

  printMainContent.addEventListener('click', () => {
    const mainContent = document.querySelector('#mainContent').cloneNode(true);
    mainContent.querySelector('div').style.display = 'none';
    const mainContentInnerHTML = mainContent.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html lang="en">
      <head>
        <title>BandHelper</title>
        <meta name="description" content="A simple songs app with metronome functionality." />
        <meta name="keywords" content="songs, metronome, music" />
        <meta name="author" content="Michael Peteichuk" />
    
        <link rel="icon" type="image/svg+xml" href="images/favicon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="./style.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Roboto', 'ui-sans-serif', 'system-ui'],
                },
              },
            },
          };
        </script>
      </head>
      <body class="font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        ${mainContentInnerHTML}
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
  });
});
