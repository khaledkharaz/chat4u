// --- Persistence Logic (localStorage and sessionStorage) ---

import { appState } from './state.js'; // Path remains ./
import {
    LOCAL_STORAGE_KEY_STATE,
    SESSION_STORAGE_KEY_UNLOCKED,
    SESSION_STORAGE_KEY_ACTIVE_PERSONA,
    SESSION_STORAGE_KEY_HISTORY,
    LOCAL_STORAGE_KEY_THEME,
    LOCAL_STORAGE_KEY_PERSONAS // NEW key
} from './config.js'; // Path remains ./
import { allPersonas as defaultPersonas } from './data/personas.js'; // Path remains ./data/, alias import

import { announce } from './domElements.js'; // Use announce from domElements.js as provided


// --- General State Persistence (Filters, etc.) ---
export const saveState = () => {
    const stateToSave = {
        filters: appState.selectedFilters,
        // TODO: Add other general state here in future features
    };
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY_STATE, JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Error saving general state to localStorage:', e);
        announce('Error saving preferences.');
    }
};

export const loadState = () => {
    try {
        const savedState = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_STATE));
        if (savedState) {
            appState.selectedFilters = Array.isArray(savedState.filters) && savedState.filters.length > 0 ? savedState.filters : ['all'];
            console.log("General state loaded from localStorage:", appState.selectedFilters);
        } else {
            console.log("No localStorage state found. Initializing defaults.");
            appState.selectedFilters = ['all'];
        }
    } catch (e) {
        console.error('Error loading general state from localStorage:', e);
        announce('Error loading preferences.');
        appState.selectedFilters = ['all'];
    }
};


// --- NEW: Persona Data Persistence (localStorage) ---

export const savePersonas = () => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PERSONAS, JSON.stringify(appState.allPersonasMutable)); // Save mutable list
        console.log(`Personas saved to localStorage. Count: ${appState.allPersonasMutable.length}`);
    } catch (e) {
        console.error('Error saving personas to localStorage:', e);
        announce('Error saving personas.');
    }
};

export const loadPersonas = () => {
    try {
        const savedPersonasString = localStorage.getItem(LOCAL_STORAGE_KEY_PERSONAS);
        if (savedPersonasString) {
            const savedPersonas = JSON.parse(savedPersonasString);
            if (Array.isArray(savedPersonas)) {
                 const validPersonas = savedPersonas.filter(p => p.key && p.name && p.instruction);
                 appState.allPersonasMutable = validPersonas; // Load into mutable list
                 console.log(`Personas loaded from localStorage. Count: ${appState.allPersonasMutable.length}`);
                 if (validPersonas.length !== savedPersonas.length) {
                      console.warn(`Filtered out ${savedPersonas.length - validPersonas.length} invalid personas during load.`);
                      announce('Some invalid personas were filtered out during load.');
                 }
            } else {
                 console.warn('Saved persona data is not an array. Using default personas.');
                 announce('Error loading saved personas. Using defaults.');
                 appState.allPersonasMutable = [...defaultPersonas]; // Use a copy of defaults
                 savePersonas(); // Save defaults back
            }
        } else {
            console.log("No persona data found in localStorage. Using default personas.");
            appState.allPersonasMutable = [...defaultPersonas]; // Use a copy of defaults
             savePersonas(); // Save defaults back
        }
    } catch (e) {
        console.error('Error loading personas from localStorage:', e);
        announce('Error loading personas. Using defaults.');
        appState.allPersonasMutable = [...defaultPersonas]; // Fallback to defaults on error
         savePersonas(); // Attempt to overwrite corrupted storage with defaults
    }
};


// --- Active Chat Persistence (sessionStorage) ---

export const saveActiveChatState = () => {
    if (appState.selectedPersona) {
         try {
             sessionStorage.setItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA, appState.selectedPersona.key);
             if (appState.conversationHistory.length > 0) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_HISTORY, JSON.stringify(appState.conversationHistory));
                console.log(`Active chat state saved for persona: ${appState.selectedPersona.name}`);
             } else {
                 sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
                  console.log(`Active chat state (empty history) saved for persona: ${appState.selectedPersona.name}`);
             }
         } catch (e) {
             console.error('Error saving active chat state to sessionStorage:', e);
             announce('Error saving current chat.');
         }
    } else {
         sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
         sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
         console.log('No active chat state to save or state explicitly cleared.');
    }
};

export const loadActiveChatState = () => {
    try {
        const savedPersonaKey = sessionStorage.getItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
        const savedHistoryString = sessionStorage.getItem(SESSION_STORAGE_KEY_HISTORY);

        if (savedPersonaKey) {
            // Find the persona in the *mutable* list
            const personaObject = appState.allPersonasMutable.find(p => p.key === savedPersonaKey); // Find in mutable list

            if (personaObject) {
                appState.selectedPersona = personaObject;
                appState.conversationHistory = savedHistoryString ? JSON.parse(savedHistoryString) : [];

                console.log(`Active chat state loaded for persona: ${appState.selectedPersona.name} (History length: ${appState.conversationHistory.length})`);
                return true;
            } else {
                console.warn(`Saved persona key "${savedPersonaKey}" not found in current persona list.`);
                sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
                sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
                announce('Could not load saved chat for a deleted persona.');
                return false;
            }
        } else {
            console.log('No active chat state found in sessionStorage.');
            return false;
        }
    } catch (e) {
        console.error('Error loading active chat state from sessionStorage:', e);
        announce('Error loading saved chat.');
        sessionStorage.removeItem(SESSION_STORAGE_KEY_ACTIVE_PERSONA);
        sessionStorage.removeItem(SESSION_STORAGE_KEY_HISTORY);
        return false;
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
          return null;
     }
};