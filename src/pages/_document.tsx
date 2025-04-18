import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload and link to external CSS file for Mux Uploader styling */}
        <link rel="preload" href="/mux-uploader-styles.css" as="style" />
        <link rel="stylesheet" href="/mux-uploader-styles.css" />

        {/* Direct style tag for immediate styling */}
        <style
          id="mux-uploader-direct-styles"
          dangerouslySetInnerHTML={{
            __html: `
            /* Immediate styling for Mux Uploader button */
            mux-uploader button,
            .mux-uploader button {
              margin-top: 0.5rem !important;
              padding: 0.5rem 1rem !important;
              background-color: rgb(37, 99, 235) !important; /* bg-blue-600 */
              color: white !important;
              border-radius: 0.375rem !important; /* rounded-md */
              transition-property: background-color !important;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
              transition-duration: 150ms !important;
              font-family: inherit !important;
              font-size: 0.875rem !important;
              line-height: 1.25rem !important;
              font-weight: 500 !important;
            }

            mux-uploader button:hover,
            .mux-uploader button:hover {
              background-color: rgb(29, 78, 216) !important; /* bg-blue-700 */
            }

            /* Hide all mux-uploader buttons initially */
            mux-uploader button {
              visibility: hidden !important;
            }

            /* Show buttons only after our class is applied */
            mux-uploader.styled button,
            button.mux-styled-button {
              visibility: visible !important;
            }
          `,
          }}
        />

        {/* Preload script for Mux Uploader styling - runs immediately */}
        <script
          id="mux-uploader-preload-document"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Function to style mux uploaders
                function styleMuxUploaders() {
                  // Apply the class to any existing mux-uploader elements
                  const uploaders = document.querySelectorAll('mux-uploader');
                  uploaders.forEach(uploader => {
                    uploader.classList.add('styled');
                  });
                }

                // Run immediately
                styleMuxUploaders();

                // Also run when DOM is loaded
                document.addEventListener('DOMContentLoaded', styleMuxUploaders);

                // Create a mutation observer to watch for mux-uploader elements
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                      mutation.addedNodes.forEach((node) => {
                        // Check if the added node is an element and has the tag name 'mux-uploader'
                        if (node.nodeType === 1) {
                          if (node.tagName && node.tagName.toLowerCase() === 'mux-uploader') {
                            node.classList.add('styled');
                          }

                          // Also check children
                          if (node.querySelectorAll) {
                            const childUploaders = node.querySelectorAll('mux-uploader');
                            childUploaders.forEach(uploader => {
                              uploader.classList.add('styled');
                            });
                          }
                        }
                      });
                    }
                  });
                });

                // Start observing the document
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true
                });
              })();
            `,
          }}
        />

        {/* Fallback for when JavaScript is disabled */}
        <noscript>
          <style>
            {`
              /* When JavaScript is disabled, show the buttons anyway */
              mux-uploader button {
                visibility: visible !important;
              }
            `}
          </style>
        </noscript>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
