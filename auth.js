
import {
    body, // Used for body.classList for CSS
    lockScreenDiv, // The lock screen overlay div
    unlockSectionDiv, // Password input section
    unlockErrorMessage,
    passwordInput,
    revealPasswordButton, // Reveal button
    lockAppButton, // Lock button
    userInput, // Need to disable/enable input
    sendButton // Need to disable/enable send button
} from './domElements.js'; // Path changes to ../js/
import { appState } from './state.js'; // Path changes to ../js/
import {
    UNLOCK_PASSWORD,
    UNLOCK_CLICK_THRESHOLD,
    SESSION_STORAGE_KEY_UNLOCKED
} from './config.js'; // Path changes to ../js/
import { saveActiveChatState, loadState, loadActiveChatState } from './persistence.js'; // Path changes to ../js/
// showView now only manages views *inside* main-app-content, not the lock overlay
import { showView } from './viewManager.js'; // Path changes to ../ui/
// filterAndRenderPersonas is still needed to set up the persona view after unlock
import { filterAndRenderPersonas } from './filtering.js'; // Path remains ./ (within logic/)

import { announce } from './domElements.js'; // Use announce from domElements.js as provided


// Function to check session storage and set initial app state (locked/unlocked)
export const checkUnlockStatus = () => {
    const isUnlocked = sessionStorage.getItem(SESSION_STORAGE_KEY_UNLOCKED) === 'true';
    if (isUnlocked) {
        // If unlocked, transition to unlocked state views
        unlockApp(false); // Unlock without saving state again (sessionStorage already set)
    } else {
        // If not unlocked, start in the locked state (shows lock screen overlay)
        lockApp(false); // Set locked state without clearing session storage (it's already clear)
    }
};

// Function to set the app to locked state (shows lock screen overlay)
export const lockApp = (removeFromSession = true) => {
    // Save active chat state before transitioning away
    saveActiveChatState();

    // Update state
    appState.isLocked = true;

    // Add locked class to body (CSS hides main content, shows lock screen overlay)
    body.classList.add('locked');

    // Clear password input UI state (on the lock screen)
    if (unlockSectionDiv) unlockSectionDiv.classList.add('hidden');
    if (unlockErrorMessage) unlockErrorMessage.classList.add('hidden');
    if (passwordInput) passwordInput.value = '';
    appState.unlockClickCount = 0;
    // Ensure the reveal button is visible again on the lock screen
     if (revealPasswordButton) revealPasswordButton.classList.remove('hidden');

     // Clear state related to the active chat (after saving!)
     appState.selectedPersona = null;
     appState.conversationHistory = [];

     // Disable chat input/send button when locked
     if (userInput) userInput.disabled = true;
     if (sendButton) sendButton.disabled = true;


    if (removeFromSession) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY_UNLOCKED);
        console.log('App locked and unlock state removed from session storage.');
         announce('App locked.'); // Announce for screen readers
    } else {
         console.log('App is locked on load.');
    }
    // No call to showView needed here. CSS handles showing #lock-screen based on body.locked.


     // Ensure the correct button has the correct ARIA label when locked (CSS controls visibility)
     if (revealPasswordButton) revealPasswordButton.setAttribute('aria-label', 'Reveal Password Input');
     if (lockAppButton) lockAppButton.setAttribute('aria-label', 'Lock App'); // Stays the same, just hidden by CSS when locked
};

// Function to set the app to unlocked state (hides lock screen, shows main content)
export const unlockApp = (saveStateToSession = true) => {
    // Update state
    appState.isLocked = false;

    // Remove locked class from body (CSS hides lock screen overlay, shows main-app-content)
    body.classList.remove('locked');


    // Clear password input UI state (on the lock screen)
    if (passwordInput) passwordInput.value = '';
    if (unlockSectionDiv) unlockSectionDiv.classList.add('hidden');
    if (unlockErrorMessage) unlockErrorMessage.classList.add('hidden');
    appState.unlockClickCount = 0;
     if (revealPasswordButton) revealPasswordButton.classList.remove('hidden'); // Ensure visible if somehow hidden


    if (saveStateToSession) {
        sessionStorage.setItem(SESSION_STORAGE_KEY_UNLOCKED, 'true');
         console.log('App unlocked and state saved to session storage.');
         announce('App unlocked.'); // Announce for screen readers
    } else {
         console.log('App unlocked from session storage.');
    }

    // Load other state (filters) first
    loadState(); // Updates appState.selectedFilters

    // --- Attempt to load active chat state ---
    const chatLoaded = loadActiveChatState(); // Updates appState.selectedPersona and appState.conversationHistory

    if (chatLoaded) {
        // If chat state loaded, go directly to chat view (within main-app-content)
        showView('chat');
         // Focus input after view transition - handled in viewManager.showView('chat')
    } else {
         // If no chat state loaded, go to persona selection as default (within main-app-content)
         filterAndRenderPersonas(); // Initial render of grid based on loaded filters/search
         showView('persona-selection');
         // Attempt to focus the search input after unlock - handled in viewManager.showView('persona-selection')
    }

     // Ensure the correct button has the correct ARIA label when unlocked (CSS controls visibility)
     if (revealPasswordButton) revealPasswordButton.setAttribute('aria-label', 'Reveal Password Input'); // Stays the same, just hidden by CSS when unlocked
     if (lockAppButton) lockAppButton.setAttribute('aria-label', 'Lock App'); // Set label for the visible button
};

// Function to attempt unlocking with a password
export const attemptUnlock = () => {
    if (!passwordInput) return;

    const enteredPassword = passwordInput.value;
    if (enteredPassword === UNLOCK_PASSWORD) {
        unlockApp(true); // Pass true to save state to session storage
    } else {
        if (unlockErrorMessage) {
            unlockErrorMessage.textContent = 'Incorrect password. Try again.';
            unlockErrorMessage.classList.remove('hidden');
        }
        passwordInput.value = '';
         if (passwordInput) passwordInput.focus();
        console.warn('Incorrect password entered.');
         announce('Incorrect password. Try again.');
    }
};

// Logic for the reveal password button click count (Now on Lock Screen Overlay)
export const handleRevealPasswordClick = () => {
    // Only count clicks if currently in the locked state (lock screen overlay is visible)
    // Use appState.isLocked for check (redundant with CSS, but safe)
    if (appState.isLocked) {
        appState.unlockClickCount++;
        console.log('Reveal Password icon clicked (lock screen), count:', appState.unlockClickCount);
        if (appState.unlockClickCount >= UNLOCK_CLICK_THRESHOLD) {
            appState.unlockClickCount = 0; // Reset count after threshold
            if (unlockSectionDiv) unlockSectionDiv.classList.remove('hidden'); // Show password input section
            // Hide the reveal button once the password input is shown
            if (revealPasswordButton) revealPasswordButton.classList.add('hidden');
            if (passwordInput) passwordInput.focus(); // Focus the input field for immediate typing
            announce('Password input revealed.');
        } else {
             // Optional: Announce remaining clicks if providing feedback
             // Only announce clicks if the password section is still hidden
             if (unlockSectionDiv && unlockSectionDiv.classList.contains('hidden')) {
                 if (UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount <= 3 && UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount > 0) {
                     announce(`${UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount} clicks remaining to reveal password input.`);
                 } else if (UNLOCK_CLICK_THRESHOLD - appState.unlockClickCount === 0) {
                     announce('Password input revealed.');
                 }
             }
        }
    }
};

// Logic for handling auto-lock on visibility change
export const handleVisibilityChange = () => {
    // Check if the document is hidden (user switched tabs or minimized)
    // AND the app is currently unlocked
    if (document.hidden && !appState.isLocked) {
        console.log('Document is hidden, auto-locking app.');
        // lockApp(true) handles showing the lock screen overlay
        lockApp(true);
    }
};

// Logic for handling beforeunload (fallback/cleanup)
export const handleBeforeUnload = () => {
    // Check if the app is currently unlocked
    if (!appState.isLocked) {
         console.log('Window is unloading, ensuring app is locked and chat state saved.');
         saveActiveChatState();
         sessionStorage.removeItem(SESSION_STORAGE_KEY_UNLOCKED);
    }
};