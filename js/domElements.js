// --- DOM Elements (References) ---
// Get references to HTML elements and export them.

export const body = document.body; // Reference to the body for the .locked class
export const mainAppContentDiv = document.getElementById('main-app-content'); // The wrapper for the main app
export const lockScreenDiv = document.getElementById('lock-screen'); // The lock screen div
export const revealPasswordButton = document.getElementById('reveal-password-button'); // Button to reveal password input
export const lockAppButton = document.getElementById('lock-app-button'); // The lock button (Lock icon)
export const unlockSectionDiv = document.getElementById('unlock-section'); // The password input section
export const passwordInput = document.getElementById('password-input'); // The password input field
export const unlockButton = document.getElementById('unlock-button'); // The unlock button
export const unlockErrorMessage = document.getElementById('unlock-error-message'); // Error message paragraph

export const personaSelectionDiv = document.getElementById('persona-selection'); // Persona selection view
export const chatContainerDiv = document.getElementById('chat-container'); // Chat view
export const personaGridDiv = document.getElementById('persona-grid'); // Grid of persona cards
export const chatHeader = document.getElementById('chat-header'); // Chat header div
export const currentPersonaSpan = document.getElementById('current-persona'); // Span for current persona name
export const chatbox = document.getElementById('chatbox'); // The chat messages container
export const userInput = document.getElementById('user-input'); // The user input field
export const sendButton = document.getElementById('send-button'); // The send button
export const darkModeToggle = document.getElementById('dark-mode-toggle'); // Dark mode toggle button
// Sun and moon icons are children, might not need direct export unless accessed outside dark mode logic
// export const sunIcon = darkModeToggle.querySelector('.sun-icon');
// export const moonIcon = darkModeToggle.querySelector('.moon-icon');
export const filterCheckboxes = document.querySelectorAll('#persona-filters input[type="checkbox"]'); // All filter checkboxes
export const personaSearchInput = document.getElementById('persona-search'); // Persona search input
export const backToPersonasButton = document.getElementById('back-to-personas'); // Button to go back to personas
export const clearChatButton = document.getElementById('clear-chat'); // Button to clear chat history

// Utility function to add a visually hidden element for ARIA status announcements - create it if it doesn't exist
export const createAriaStatusElement = () => {
    let status = document.getElementById('aria-live-status');
    if (!status) {
        status = document.createElement('div');
        status.id = 'aria-live-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        // Style to make it visually hidden but available to screen readers (requires CSS .visually-hidden)
        status.classList.add('visually-hidden');
        document.body.appendChild(status);
    }
    return status;
};

// Function to announce text for screen readers
// Requires the aria status element to exist
let ariaStatusElement = null;
export const announce = (text) => {
     if (!ariaStatusElement) {
          ariaStatusElement = createAriaStatusElement();
     }
    // Clear previous announcement to ensure new one is read
    ariaStatusElement.textContent = '';
    // Set timeout to allow screen reader to process previous state change if any
    setTimeout(() => {
        ariaStatusElement.textContent = text;
    }, 100);
};