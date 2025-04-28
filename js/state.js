// --- State Management ---
// Central app state object. Properties can be read and modified by other modules.

export const appState = {
    // Lock/Unlock State
    unlockClickCount: 0, // Track clicks to reveal password input

    // View State
    currentState: 'persona-selection', // 'persona-selection' or 'chat'

    // Persona Selection State (Feature 1)
    selectedFilters: [], // Array of selected filter values (default to ['all'] later)
    currentSearchTerm: '', // Track the current search input value

    // Chat State (Feature 4 - Currently only supports one active chat)
    selectedPersona: null, // Will store the selected persona object {key, name, instruction, ...}
    conversationHistory: [], // Stores messages [{ role: 'user'|'model', parts: [{text: '...'}] }]

    // Add other state properties here as needed...
    // e.g., saved chats list, settings, etc.
};

// Note: Direct mutation of appState.property = value is used here for simplicity.
// For larger applications, you might use functions like setState({ prop: value })
// or a state management library for better control and predictability.