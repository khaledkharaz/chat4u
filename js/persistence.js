// --- Persistence Logic (localStorage and sessionStorage) ---

import { appState } from './state.js';
import {
    LOCAL_STORAGE_KEY_STATE,
    SESSION_STORAGE_KEY_UNLOCKED,
    SESSION_STORAGE_KEY_ACTIVE_PERSONA,
    SESSION_STORAGE_KEY_HISTORY,
    LOCAL_STORAGE_KEY_THEME
} from './config.js';
import { allPersonas } from './data/personas.js'; // Needed to find persona object by key during load
import { announce } from './domElements.js'; // For announcements on load failures etc.


// --- General State Persistence (Filters, etc.) ---

export const saveState = () => {
    const stateToSave = {
        filters: appState.selectedFilters,
        // TODO: Add other state here in future features (like dynamic personas)
    };
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY_STATE, JSON.stringify(stateToSave));
        // console.log('State saved:', stateToSave);
    } catch (e) {
        console.error('Error saving general state to localStorage:', e);
        announce('Error saving preferences.');
    }
};

export const loadState = () => {
    try {
        const savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_STATE));
        if (savedState) {
            // Load filters, default to ['all'] if null or empty array from storage
            appState.selectedFilters = Array.isArray(savedState.filters) && savedState.filters.length > 0 ? savedState.filters : ['all'];
            // TODO: Load other state here in future features
            console.log("General state loaded from localStorage:", appState.selectedFilters);
        } else {
            console.log("No localStorage state found. Initializing defaults.");
            appState.selectedFilters = ['all']; // Default to 'all' filter if no state
        }
    } catch (e) {
        console.error('Error loading general state from localStorage:', e);
        announce('Error loading preferences.');
        // Fallback to defaults if load fails
        appState.selectedFilters = ['all'];
    }
    // Note: updateFilterCheckboxes needs to be called from the view layer after loadState
};


// --- Active Chat Persistence (sessionStorage) ---

// Function to save the current chat state to sessionStorage
export const saveActiveChatState = () => {
    // Only save if a persona is selected and there's history OR we explicitly want to clear state
    if (appState.selectedPersona) {
         try {
             if (appState.conversationHistory.length > 0) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA, appState.selectedPersona.key);
                sessionStorage.setItem(SESSION_STORAGE_KEY_HISTORY, JSON.stringify(appState.conversationHistory));
                console.log(`Active chat state saved for persona: ${appState.selectedPersona.name}`);
             } else {
                 // If history is empty but a persona is selected, save the persona key but clear history
                 // This allows returning to an empty chat with that persona
                 sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA, appState.selectedPersona.key);
                 sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY); // Ensure history is empty
                 console.log(`Active chat state (empty history) saved for persona: ${appState.selectedPersona.name}`);
             }
         } catch (e) {
             console.error('Error saving active chat state to sessionStorage:', e);
             announce('Error saving current chat.');
         }
    } else {
         // Clear state if there's no active chat to save (e.g., after clearing history or going back)
         sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
         sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
         console.log('No active chat state to save or state explicitly cleared.');
    }
};

// Function to load saved chat state from sessionStorage
// Returns true if state was loaded, false otherwise.
export const loadActiveChatState = () => {
    try {
        const savedPersonaKey = sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
        const savedHistoryString = sessionStorage.getItem(SESSION_STORAGE_KEY_HISTORY);

        if (savedPersonaKey) { // Check for key first, history might be empty but persona still active
            const personaObject = allPersonas.find(p => p.key === savedPersonaKey); // TODO: Use mutable data source in Feature 2

            if (personaObject) {
                appState.selectedPersona = personaObject;
                // Load history only if it exists, otherwise initialize as empty
                appState.conversationHistory = savedHistoryString ? JSON.parse(savedHistoryString) : [];

                console.log(`Active chat state loaded for persona: ${appState.selectedPersona.name} (History length: ${appState.conversationHistory.length})`);
                return true; // State successfully loaded
            } else {
                console.warn(`Saved persona key "${savedPersonaKey}" not found in persona list.`);
                // If persona not found, clear the invalid saved state
                sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
                sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
                announce('Could not load saved chat for an old persona.');
                return false; // Persona not found
            }
        } else {
            console.log('No active chat state found in sessionStorage.');
            return false; // No state saved
        }
    } catch (e) {
        console.error('Error loading active chat state from sessionStorage:', e);
        announce('Error loading saved chat.');
        // Clear corrupted state on error
        sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
        sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
        return false; // Error loading state
    }
};


// --- Theme Persistence (localStorage) ---

export const saveTheme = (theme) => {
     try {
          localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
          console.log('Theme saved:', theme);
     } catch (e) {
          console.error('Error saving theme to localStorage:', e);
          announce('Error saving theme preference.');
     }
};

export const loadTheme = () => {
     try {
          const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
          console.log('Theme loaded:', savedTheme);
          return savedTheme;
     } catch (e) {
          console.error('Error loading theme from localStorage:', e);
          announce('Error loading theme preference.');
          return null; // Return null if load fails
     }
};