window.addEventListener('DOMContentLoaded', () => {
  const printMainContent = document.getElementById('printMainContent');
  let savedPrintContent = null; // Variable to save printing content

  if (!printMainContent) return;

  printMainContent.addEventListener('click', () => {
    const mainContent = document.querySelector('#mainContent').cloneNode(true);

    const divToHide = mainContent.querySelector('div');
    if (divToHide) {
      divToHide.style.display = 'none';
    }

    const mainContentInnerHTML = mainContent.innerHTML;
    savedPrintContent = mainContentInnerHTML; // Save the printing content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>BandHelper</title>
        <meta name="description" content="A simple songs app with metronome functionality." />
        <meta name="keywords" content="songs, metronome, music" />
        <meta name="author" content="Michael Peteichuk" />
        <link rel="manifest" href="manifest.json" />
    
        <link rel="icon" type="image/svg+xml" href="images/favicon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="#2563eb"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="#1e40af"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="images/apple-touch-icon.png" />
        
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
        
        <style>
          @media print {
            #controls {
              display: none;
            }
          }
        </style>
      </head>
      <body class="font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <div id="controls" class="mb-4 flex justify-end w-full border-b py-2">
          <button
            id="closePrintWindow"
            class="px-4 py-2 bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded font-medium transition-colors text-center"
            type="button"
          >
            &times; Close
          </button>
        </div>
        <div id="printContainer">
          ${savedPrintContent}
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();

    const checkWindowClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkWindowClosed);
      }
    }, 500);

    printWindow.onload = () => {
      const closeButton = printWindow.document.getElementById('closePrintWindow');
      closeButton.addEventListener('click', () => {
        printWindow.close();
      });

      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        clearInterval(checkWindowClosed);
        printWindow.close();
      };
    };

    printWindow.onbeforeunload = () => {
      clearInterval(checkWindowClosed);
    };
  });
});
