
// --- State Management ---
// Central app state object. Properties can be read and modified by other modules.

export const appState = {
    // Lock/Unlock State
    unlockClickCount: 0, // Track clicks to reveal password input
    isLocked: true, // Add a boolean flag for lock state

    // View State
    // Reverted: Default state when unlocked will be determined by loadActiveChatState or set to 'persona-selection'
    // It's not 'home' initially anymore. The 'home' concept is now tied to the 'locked' boolean.
    // The state will be 'locked' *implicitly* when isLocked is true.
    // When unlocked, the *first* view shown will be 'persona-selection' unless a chat is loaded.
    currentState: 'persona-selection', // Default view when unlocked

    // Persona Data (Mutable)
    allPersonasMutable: [], // This will hold the dynamic list of personas

    // Persona Selection State (Feature 1)
    selectedFilters: [], // Array of selected filter values (default to ['all'] later)
    currentSearchTerm: '', // Track the current search input value

    // Chat State (Feature 4 - Currently only supports one active chat)
    selectedPersona: null, // Will store the selected persona object {key, name, instruction, ...}
    conversationHistory: [], // Stores messages [{ role: 'user'|'model', parts: [{text: '...'}] }]

    // Add other state properties here as needed...
};