// --- Main Application Entry Point ---
// Orchestrates initial setup and attaches event listeners.

import { appState } from './state.js'; // Path remains ./

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
    revealPasswordButton, // Reveal password button (now on lock screen)
    lockAppButton, // Lock app button (in global controls)
    createAriaStatusElement, // Ensure ARIA status element exists
    managePersonasButton // Button to access management view
} from './domElements.js'; // Path remains ./
import { loadTheme, saveTheme, loadState, loadPersonas, saveActiveChatState } from './persistence.js'; // Path remains ./, import loadPersonas, saveActiveChatState
import { applyTheme, updateFilterCheckboxes } from './render.js'; // Path changes to ../ui/
import { announce } from './domElements.js'; // Use announce from domElements.js as provided

// showView now only manages views *inside* main-app-content
import { startChat, goBackToPersonas, clearChatHistory, showPersonaManagementView, showView } from './viewManager.js'; // Path changes to ../ui/, import showView
// Auth logic handles the actual locking/unlocking state transitions and showing/hiding the lock screen overlay
import { handleRevealPasswordClick, attemptUnlock, checkUnlockStatus, lockApp, handleVisibilityChange, handleBeforeUnload } from './auth.js'; // Path changes to ../logic/
import { handleFilterChange, handleSearchInput, filterAndRenderPersonas } from './filtering.js'; // Path changes to ../logic/

import { sendMessage } from './core.js'; // Path changes to ../logic/chat/

import { setupPersonaManagementListeners } from './personaManagementUi.js'; // Path changes to ../ui/
import { getPersonaByKey, deletePersona, savePersona } from './personaManagement.js'; // Path changes to ../logic/


document.addEventListener('DOMContentLoaded', () => {

    // --- Initial Setup ---

    // Ensure ARIA status element is created early (defined in domElements.js)
    createAriaStatusElement();

    // Load theme preference immediately
    const savedTheme = loadTheme();
    applyTheme(savedTheme || 'light');

    // NEW: Load personas from storage (or defaults)
    loadPersonas(); // Initializes appState.allPersonasMutable

    // Check unlock status. This calls lockApp() or unlockApp()
    // lockApp shows the lock screen overlay, unlockApp loads state and shows either persona selection or chat.
    checkUnlockStatus();


    // After initial load (handled by checkUnlockStatus which calls loadState if unlocking),
    // ensure filter checkboxes visually match the loaded state.
    // This needs to be called regardless of lock state initially, but filtering/rendering
    // will only happen when the persona selection view is active.
    updateFilterCheckboxes();


    // --- Event Listeners ---

    // Dark Mode Toggle
    if (darkModeToggle) { // Add defensive check
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            saveTheme(newTheme);
             announce(`Theme switched to ${newTheme} mode.`);
        });
    }


    // Feature 3: Unlock/Lock Event Listeners

    // Reveal Password Button (Now on Lock Screen Overlay)
    if (revealPasswordButton) revealPasswordButton.addEventListener('click', handleRevealPasswordClick);

    // Unlock Button (Inside the password section)
    if (unlockButton) unlockButton.addEventListener('click', attemptUnlock);

    // Password Input Field (Listen for Enter key)
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                attemptUnlock();
            }
        });
    }

    // Lock App Button (Now triggers the lock screen overlay)
    // This button is visible when the app is unlocked (via CSS)
    if (lockAppButton) {
        lockAppButton.addEventListener('click', () => {
             // Check if unlocked before locking (redundant due to CSS, but safe)
             if (!appState.isLocked) { // Use state property
                 lockApp(true); // Lock the app and remove session storage flag, shows lock screen overlay
             }
        });
    }


    // Automatic Lock Functionality Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);


    // Feature 1: Persona Filtering & Search Listeners
    const filterOptionsDiv = document.querySelector('#persona-filters .filter-options');
    if (filterOptionsDiv) {
        filterOptionsDiv.addEventListener('change', handleFilterChange);
    }
    if (personaSearchInput) personaSearchInput.addEventListener('input', handleSearchInput);


    // Persona Card Click Listener (using delegation on the grid)
    if (personaGridDiv) {
        personaGridDiv.addEventListener('click', (event) => {
             // Ensure selection is only interactive when unlocked and in the persona selection view
             if (appState.isLocked || appState.currentState !== 'persona-selection') { // Use state properties
                 console.warn("Attempted to select persona while app is locked or not on persona selection view.");
                 return;
             }
            const clickedCard = event.target.closest('.persona-card');
            if (clickedCard && !clickedCard.disabled) {
                const personaKey = clickedCard.dataset.key;
                // Find persona in the mutable list
                const personaObject = appState.allPersonasMutable.find(p => p.key === personaKey);
                if (personaObject) {
                    startChat(personaObject);
                } else {
                     console.warn(`Clicked persona with key ${personaKey} not found in mutable list.`);
                     announce(`Selected persona not found.`);
                }
            }
        });
    }


    // Chat Input Listeners
    if (sendButton) sendButton.addEventListener('click', sendMessage);
    if (userInput) {
         userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                 // Check if unlocked and in chat view, and input is enabled before sending
                 if (!appState.isLocked && appState.currentState === 'chat' && !userInput.disabled) { // Use state properties
                    sendMessage();
                 }
            }
        });
    }


    // Chat Header Button Listeners
    const backToPersonasButton = document.getElementById('back-to-personas');
    const clearChatButton = document.getElementById('clear-chat');

    if (backToPersonasButton) {
        backToPersonasButton.addEventListener('click', goBackToPersonas);
    }
    if (clearChatButton) {
        clearChatButton.addEventListener('click', clearChatHistory);
    }

    // NEW: Persona Management Button Listener
    // Listener for the button that navigates TO the management view
    if (managePersonasButton) {
         managePersonasButton.addEventListener('click', showPersonaManagementView); // Calls viewManager function
    }

         const apiKeyTrigger = document.getElementById('api-key-trigger');
        const apiKeySection = document.getElementById('api-key-section');
        const apiKeyInput = document.getElementById('api-key-input');
        const saveApiKeyButton = document.getElementById('save-api-key-button');
      
        // --- Cookie Handling Functions ---
        // Simple functions to get and set cookies
      
        function setCookie(name, value, days) {
          let expires = "";
          if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
          }
          document.cookie = name + "=" + (value || "") + expires + "; path=/";
        }
      
        function getCookie(name) {
          const nameEQ = name + "=";
          const ca = document.cookie.split(';');
          for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
          }
          return null;
        }
      
        // --- Component Logic ---
      
        // 1. Load API key from cookie when the page loads (optional - good for showing existing key)
        //    NOTE: The section is hidden initially. The key is loaded into the INPUT
        //    when the section is opened (see trigger click handler).
      
        // 2. Toggle section visibility when the trigger icon is clicked
        apiKeyTrigger.addEventListener('click', () => {
          const isHidden = apiKeySection.classList.contains('hidden');
      
          if (isHidden) {
            // If currently hidden, show it
            apiKeySection.classList.remove('hidden');
            // When showing, load the current key from cookie into the input field
            const currentKey = getCookie('userApiKey'); // Use a consistent cookie name
            if (currentKey) {
              apiKeyInput.value = currentKey;
            } else {
              // Clear input if no key exists in cookie
              apiKeyInput.value = '';
            }
          } else {
            // If currently visible, hide it
            apiKeySection.classList.add('hidden');
            // Optional: Clear the input field when hiding for privacy
            // apiKeyInput.value = '';
          }
        });
      
        // 3. Save API key to cookie when the Save button is clicked
        saveApiKeyButton.addEventListener('click', () => {
          const apiKey = apiKeyInput.value.trim(); // Get value and remove whitespace
      
          if (apiKey) {
            // Save the key to a cookie named 'userApiKey' for 30 days
            setCookie('userApiKey', apiKey, 30);
            console.log('API Key saved.');
            // You might want to add a visual confirmation to the user
          } else {
            // If input is empty, remove the cookie
            setCookie('userApiKey', '', -1); // Setting expiry to -1 effectively deletes the cookie
            console.log('API Key cleared.');
            // Optional: Add a confirmation message
          }
      
          // Close the section after saving/clearing
          apiKeySection.classList.add('hidden');
      
          // Optional: Clear the input field after saving/clearing
          // apiKeyInput.value = '';
        });
      
        // --- Function to retrieve the saved API key from anywhere in your app ---
        // You will call this function whenever you need the API key for your API calls.
        window.getSavedApiKey = () => {
            return getCookie('userApiKey');
        };
      
    


    // NEW: Setup Listeners specific to the Persona Management View and Form
    setupPersonaManagementListeners();

    // Initial state of chat input disabled/enabled based on API key is handled within unlockApp and startChat.

});