
// --- Main Application Entry Point ---
// Orchestrates initial setup and attaches event listeners.
import { allPersonas } from './data/personas.js'// --- Data: Persona Definitions ---

import {
    body, // Needed for dark mode and lock check
    darkModeToggle, // Dark mode button
    filterCheckboxes, // Filter checkboxes
    personaSearchInput, // Search input
    personaGridDiv, // Persona grid container for delegation
    sendButton, // Send button
    userInput, // Chat input field
    unlockButton, // Unlock button
    passwordInput, // Password input field
    revealPasswordButton, // Reveal password button
    lockAppButton, // Lock app button
    createAriaStatusElement // Ensure ARIA status element exists
} from './domElements.js'; // Import all necessary DOM elements
import { loadTheme, saveTheme } from './persistence.js'; // Import theme persistence
import { applyTheme, announce, updateFilterCheckboxes } from '../ui/render.js'; // Import rendering/UI update functions
import { startChat, goBackToPersonas, clearChatHistory } from '../ui/viewManager.js'; // Import view management functions
import { handleRevealPasswordClick, attemptUnlock, checkUnlockStatus, lockApp, handleVisibilityChange, handleBeforeUnload } from '../logic/auth.js'; // Import auth logic
import { handleFilterChange, handleSearchInput, filterAndRenderPersonas } from '../logic/filtering.js'; // Import filtering logic
import { sendMessage } from '../logic/chat/core.js'; // Import core chat logic


document.addEventListener('DOMContentLoaded', () => {

    // --- Initial Setup ---

    // Ensure ARIA status element is created early
    createAriaStatusElement();

    // Load theme preference immediately
    const savedTheme = loadTheme();
    applyTheme(savedTheme || 'light');

    // Check unlock status. This calls lockApp() or unlockApp()
    // unlockApp now handles loading general state (filters) and chat state,
    // and showing the correct initial view based on loaded state.
    checkUnlockStatus();

    // After initial load (handled by checkUnlockStatus which calls loadState),
    // ensure filter checkboxes visually match the loaded state.
    // This is called whether unlocked or not, but the filter listeners
    // will prevent changes if locked.
    updateFilterCheckboxes();


    // --- Event Listeners ---

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        saveTheme(newTheme); // Save preference
         announce(`Theme switched to ${newTheme} mode.`);
    });

    // Feature 3: Unlock/Lock Event Listeners
    revealPasswordButton.addEventListener('click', handleRevealPasswordClick);
    unlockButton.addEventListener('click', attemptUnlock);
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission
            attemptUnlock();
        }
    });
    lockAppButton.addEventListener('click', () => {
         // Check if unlocked before locking (redundant due to CSS, but safe)
         if (!body.classList.contains('locked')) {
             lockApp(true); // Lock the app and remove session storage flag
         }
    });

    // NEW: Automatic Lock Functionality Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload); // Primarily for saving chat state on unload

    // Feature 1: Persona Filtering & Search Listeners
    const filterOptionsDiv = document.querySelector('#persona-filters .filter-options'); // Get container for delegation
    if (filterOptionsDiv) { // Defensive check
        filterOptionsDiv.addEventListener('change', handleFilterChange);
    }
    personaSearchInput.addEventListener('input', handleSearchInput);


    // Persona Card Click Listener (using delegation on the grid)
    personaGridDiv.addEventListener('click', (event) => {
         // Ensure selection is only interactive when unlocked
         if (body.classList.contains('locked')) {
             console.warn("Attempted to select persona while app is locked.");
             return;
         }
        const clickedCard = event.target.closest('.persona-card');
        if (clickedCard && !clickedCard.disabled) {
            const personaKey = clickedCard.dataset.key;
            // TODO: In Feature 2, this should use the mutable persona data source
            const personaObject = allPersonas.find(p => p.key === personaKey);
            if (personaObject) {
                startChat(personaObject); // Calls viewManager function
                // TODO: Needs modification for Feature 4 (multiple chats)
            }
        }
    });


    // Chat Input Listeners
    sendButton.addEventListener('click', sendMessage); // Calls chat logic function
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
             // Check if unlocked and input is enabled before sending
             if (!body.classList.contains('locked') && !userInput.disabled) {
                sendMessage(); // Calls chat logic function
             }
        }
    });

    // Chat Header Button Listeners
    // These buttons live inside the chat view, should only be active when in chat
    const backToPersonasButton = document.getElementById('back-to-personas');
    const clearChatButton = document.getElementById('clear-chat');

    if (backToPersonasButton) { // Defensive check
        backToPersonasButton.addEventListener('click', goBackToPersonas); // Calls viewManager function
    }
    if (clearChatButton) { // Defensive check
        clearChatButton.addEventListener('click', clearChatHistory); // Calls viewManager function
    }

    // Initial state of chat input disabled/enabled based on API key
    // This is handled within unlockApp and startChat.
    // The API key check warning is logged in logic/chat/api.js
}); 