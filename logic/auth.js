// --- Authentication Logic (Lock/Unlock) ---

import {
    body,
    unlockSectionDiv,
    unlockErrorMessage,
    passwordInput,
    revealPasswordButton,
    lockAppButton,
    userInput, // Need to disable/enable input
    sendButton // Need to disable/enable send button
} from '../js/domElements.js';
import { appState } from '../js/state.js';
import {
    UNLOCK_PASSWORD,
    UNLOCK_CLICK_THRESHOLD,
    SESSION_STORAGE_KEY_UNLOCKED
} from '../js/config.js';
import { saveActiveChatState, loadState, loadActiveChatState } from '../js/persistence.js'; // Need persistence functions
import { showView } from '../ui/viewManager.js'; // Need to switch views after unlock/lock
import { filterAndRenderPersonas } from './filtering.js'; // Need to render grid after unlock

import { announce } from '../ui/render.js'
// Function to check session storage and set initial app state (locked/unlocked)
export const checkUnlockStatus = () => {
    const isUnlocked = sessionStorage.getItem(SESSION_STORAGE_KEY_UNLOCKED) === 'true';
    if (isUnlocked) {
        unlockApp(false); // Unlock without saving state again (sessionStorage already set)
        // unlockApp now handles loading chat state and showing the correct view based on state.
    } else {
        lockApp(false); // Lock without removing state (it's not there)
        // App remains in locked state until unlocked
        // No need to load chat state if locked initially
    }
};

// Function to set the app to locked state
export const lockApp = (removeFromSession = true) => {
    // --- Save active chat state before clearing ---
    saveActiveChatState();

    body.classList.add('locked');
    // CSS handles visibility of #reveal-password-button and #lock-app-button

    unlockSectionDiv.classList.add('hidden'); // Hide password input section
    unlockErrorMessage.classList.add('hidden'); // Hide error message
    passwordInput.value = ''; // Clear any input password
    appState.unlockClickCount = 0; // Reset click count on lock

     // Hide views within main content in case the app was unlocked briefly
     // (This is important if you were in the chat view when locking)
     document.querySelectorAll('#main-app-content .view').forEach(view => {
         view.classList.add('hidden');
         view.setAttribute('aria-hidden', 'true');
     });

     // Clear state related to the active chat and history when locking (after saving!)
     appState.selectedPersona = null;
     appState.conversationHistory = [];
     // chatbox.innerHTML = ''; // Clearing chatbox content is handled by the viewManager or render logic when needed, maybe not strictly here.

     userInput.disabled = true; // Disable input
     sendButton.disabled = true;

    if (removeFromSession) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY_UNLOCKED);
        // We decided to keep the chat state saved in session storage upon lock,
        // so it can be restored if the user unlocks again within the same session.
        // It will be cleared if they clear chat or close the browser.
        console.log('App locked and unlock state removed from session storage.');
         announce('App locked.'); // Announce for screen readers
    } else {
         console.log('App is locked on load.');
    }
     // Ensure the correct button has the correct ARIA label when locked (CSS controls visibility)
     revealPasswordButton.setAttribute('aria-label', 'Reveal Password Input');
     lockAppButton.setAttribute('aria-label', 'Lock App'); // Stays the same, just hidden
};

// Function to set the app to unlocked state
export const unlockApp = (saveStateToSession = true) => {
    body.classList.remove('locked');
     // CSS handles visibility of #reveal-password-button and #lock-app-button

    passwordInput.value = ''; // Clear password input
    unlockSectionDiv.classList.add('hidden'); // Hide password input section
    unlockErrorMessage.classList.add('hidden'); // Hide error message
    appState.unlockClickCount = 0; // Reset click count

    if (saveStateToSession) {
        sessionStorage.setItem(SESSION_STORAGE_KEY_UNLOCKED, 'true');
         console.log('App unlocked and state saved to session storage.');
         announce('App unlocked.'); // Announce for screen readers
    } else {
         console.log('App unlocked from session storage.');
    }

    // Load other state (filters) first
    loadState(); // Updates appState.selectedFilters
    // The checkbox update based on loaded state is handled in main's load flow

    // --- Attempt to load active chat state ---
    const chatLoaded = loadActiveChatState(); // Updates appState.selectedPersona and appState.conversationHistory

    if (chatLoaded) {
        showView('chat'); // Go directly to chat view if state loaded
         // Render history after view is shown - handled in renderChatHistory
         // Focus input after view transition - handled in startChat or logic/chat/core
    } else {
         // If no chat state loaded, go to persona selection as default
         filterAndRenderPersonas(); // Initial render of grid based on loaded filters/search
         showView('persona-selection');
         // Attempt to focus the search input after unlock - handled in goBackToPersonas
    }

     // Ensure the correct button has the correct ARIA label when unlocked (CSS controls visibility)
     revealPasswordButton.setAttribute('aria-label', 'Reveal Password Input'); // Stays the same, just hidden
     lockAppButton.setAttribute('aria-label', 'Lock App'); // Set label for the visible button

     // API Key check: Ensure chat input is enabled ONLY if unlocked AND key is valid.
     // This check is handled within startChat (called if a persona is selected)
     // and sendMessage (called before API fetch). No need to enable/disable globally here.
};

// Function to attempt unlocking with a password
export const attemptUnlock = () => {
    const enteredPassword = passwordInput.value;
    if (enteredPassword === UNLOCK_PASSWORD) {
        unlockApp(true); // Pass true to save state to session storage
        // unlockApp now handles loading chat state and showing the correct view
    } else {
        unlockErrorMessage.textContent = 'Incorrect password. Try again.';
        unlockErrorMessage.classList.remove('hidden');
        passwordInput.value = ''; // Clear input
         passwordInput.focus(); // Keep focus on input after failed attempt
        console.warn('Incorrect password entered.');
         announce('Incorrect password. Try again.'); // Announce error
    }
};

// Logic for the reveal password button click count
export const handleRevealPasswordClick = () => {
    // Only count clicks if currently in the locked state (redundant due to CSS, but safe)
    if (body.classList.contains('locked')) {
        appState.unlockClickCount++;
        console.log('Reveal Password icon clicked (locked), count:', appState.unlockClickCount);
        if (appState.unlockClickCount >= UNLOCK_CLICK_THRESHOLD) {
            appState.unlockClickCount = 0; // Reset count after threshold
            unlockSectionDiv.classList.remove('hidden'); // Show password input section
            passwordInput.focus(); // Focus the input field for immediate typing
            announce('Password input revealed.'); // Announce for a11y
             // Optional: Hide the reveal button temporarily while password input is shown?
             // revealPasswordButton.classList.add('hidden');
        } else {
             // Optional: Announce remaining clicks if providing feedback
             if (UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount <= 3 && UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount > 0) { // Announce last few clicks, avoid announcing 0
                 announce(`${UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount} clicks remaining to reveal password input.`);
             } else if (UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount === 0) {
                 announce('Password input revealed.'); // Redundant, but ensures announcement on exactly 5th click
             }
        }
    }
     // If app is unlocked, clicks on *this specific button* are ignored (or it's hidden by CSS).
};

// Logic for handling auto-lock on visibility change
export const handleVisibilityChange = () => {
    // Check if the document is hidden (user switched tabs or minimized)
    // AND the app is currently unlocked
    if (document.hidden && !body.classList.contains('locked')) {
        console.log('Document is hidden, auto-locking app.');
        lockApp(true); // Lock the app and remove session storage flag
    }
     // If document becomes visible again, no action needed here.
     // The next load will check sessionStorage, or it remains locked if locked.
};

// Logic for handling beforeunload (fallback/cleanup)
export const handleBeforeUnload = () => {
    // Check if the app is currently unlocked
    if (!body.classList.contains('locked')) {
         console.log('Window is unloading, ensuring app is locked and chat state saved.');
         // Save the current chat state before the window unloads
         saveActiveChatState();
         // Remove the session storage UNLOCK item directly as lockApp might not complete fully during unload
         sessionStorage.removeItem(SESSION_STORAGE_KEY_UNLOCKED);
    } else {
        // If locked, ensure any pending password input state is cleared? (Maybe overkill)
    }
};