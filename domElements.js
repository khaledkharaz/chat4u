
// --- DOM Elements (References) ---
// Get references to HTML elements and export them.

export const body = document.body; // Reference to the body for the .locked class
export const mainAppContentDiv = document.getElementById('main-app-content'); // The wrapper for the main app content views

// --- Lock/Unlock & Home Screen Elements ---
// Reverted: No specific 'homeScreenDiv' needed anymore. #lock-screen is just the overlay.
export const lockScreenDiv = document.getElementById('lock-screen'); // The lock screen overlay div
export const revealPasswordButton = document.getElementById('reveal-password-button'); // Button to reveal password input (now on lock screen)
export const lockAppButton = document.getElementById('lock-app-button'); // The lock button (Lock icon, in global controls)
export const unlockSectionDiv = document.getElementById('unlock-section'); // The password input section (now on lock screen)
export const passwordInput = document.getElementById('password-input'); // The password input field
export const unlockButton = document.getElementById('unlock-button'); // The unlock button
export const unlockErrorMessage = document.getElementById('unlock-error-message'); // Error message paragraph


// --- Main App Content Views ---
// These are the views shown *inside* main-app-content when unlocked
export const personaSelectionDiv = document.getElementById('persona-selection'); // Persona selection view
export const chatContainerDiv = document.getElementById('chat-container'); // Chat view
export const personaManagementDiv = document.getElementById('persona-management'); // Persona management view

// --- Persona Selection View Elements ---
export const personaGridDiv = document.getElementById('persona-grid'); // Grid of persona cards
export const filterCheckboxes = document.querySelectorAll('#persona-filters input[type="checkbox"]'); // All filter checkboxes
export const personaSearchInput = document.getElementById('persona-search'); // Persona search input
export const managePersonasButton = document.getElementById('manage-personas-button'); // Button to access management view

// --- Chat View Elements ---
export const chatHeader = document.getElementById('chat-header'); // Chat header div
export const currentPersonaSpan = document.getElementById('current-persona'); // Span for current persona name
export const chatbox = document.getElementById('chatbox'); // The chat messages container
export const userInput = document.getElementById('user-input'); // The user input field
export const sendButton = document.getElementById('send-button'); // The send button
export const backToPersonasButton = document.getElementById('back-to-personas'); // Button to go back to personas
export const clearChatButton = document.getElementById('clear-chat'); // Button to clear chat history

// --- Persona Management View Elements ---
export const addPersonaButton = document.getElementById('add-persona-button'); // Button to open add form
export const backFromManagementButton = document.getElementById('back-from-management-button'); // Button to go back from management
export const personaManagementList = document.getElementById('persona-management-list'); // Container for management list items
export const personaFormModal = document.getElementById('persona-form-modal'); // The form modal
export const personaFormTitle = document.getElementById('persona-form-title'); // Title inside the form
export const personaForm = document.getElementById('persona-form'); // The form element
export const formPersonaKey = document.getElementById('form-persona-key'); // Hidden input for key
export const formPersonaName = document.getElementById('form-persona-name'); // Name input
export const formPersonaInstruction = document.getElementById('form-persona-instruction'); // Instruction textarea
export const formPersonaTypes = document.getElementById('form-persona-types'); // Types input
export const formPersonaCategories = document.getElementById('form-persona-categories'); // Categories input
export const cancelFormButton = document.getElementById('cancel-form-button'); // Cancel button in form

// --- Global Control Elements ---
export const darkModeToggle = document.getElementById('dark-mode-toggle'); // Dark mode toggle button

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

// Function to announce text for screen readers (kept here as it uses the element)
let ariaStatusElement = null;
export const announce = (text) => {
     if (!ariaStatusElement) {
          ariaStatusElement = createAriaStatusElement();
     }
    ariaStatusElement.textContent = '';
    setTimeout(() => {
        ariaStatusElement.textContent = text;
    }, 100);
};