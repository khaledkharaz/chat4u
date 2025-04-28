// --- View Switching Logic ---
// Functions to handle changing the visible view and related state transitions.

import {
    body,
    mainAppContentDiv, // The wrapper for the main app views
    personaSelectionDiv, // Persona selection view
    chatContainerDiv, // Chat view
    currentPersonaSpan, // Span for current persona name in chat header
    userInput, // Chat input field
    sendButton, // Send button
    chatbox // Chat messages container
} from '../js/domElements.js';
 import { appState } from '../js/state.js';

import { saveActiveChatState, loadActiveChatState } from '../js/persistence.js';
import { renderChatHistory, announce, displayBotMessage } from './render.js'; // Need renderChatHistory, announce, displayBotMessage
import { filterAndRenderPersonas } from '../logic/filtering.js'; // Need to re-render persona grid
import { GOOGLE_API_KEY } from '../js/config.js'; // <<< CORRECTED: Static import GOOGLE_API_KEY


// Function to switch visible view with transition
// This function assumes it operates *within* #main-app-content
export const showView = (viewName) => {
    // Ensure this only runs if the app is unlocked
     if (body.classList.contains('locked')) {
         console.warn(`Attempted to show view '${viewName}' while app is locked.`);
         return; // Prevent view changes if locked
     }

    appState.currentState = viewName; // Update state

    const allViews = mainAppContentDiv.querySelectorAll('.view'); // Get all direct children with class 'view' inside main content
    allViews.forEach(view => {
        // Determine the expected element for the view based on the name
        let targetViewElement = null;
        if (viewName === 'chat') {
            targetViewElement = chatContainerDiv;
        } else if (viewName === 'persona-selection') {
            targetViewElement = personaSelectionDiv;
        }
        // Add checks for other view elements if they are introduced

        if (view === targetViewElement) {
             view.classList.remove('hidden'); // Remove display: none
             view.setAttribute('aria-hidden', 'false');
             // If using opacity/transform transitions, manage those here or via CSS
        } else {
             view.classList.add('hidden'); // Add display: none
             view.setAttribute('aria-hidden', 'true');
             // If using opacity/transform transitions, ensure they are set correctly
        }
    });
};


// Function to handle starting a chat (called when a card is clicked)
// This function is for STARTING A *NEW* CHAT.
// TODO: This needs modification for Feature 4 (multiple chats)
export const startChat = (persona) => {
    if (!persona) {
        console.error("No persona provided to startChat.");
        return;
    }

    // --- NEW: Save the *previous* active chat state before starting a new one ---
    // This ensures that if the user navigates to a new chat, the old one is saved
    // in sessionStorage for the duration of the session.
    saveActiveChatState();

    appState.selectedPersona = persona; // Set the selected persona object
    appState.conversationHistory = []; // Clear history for a *new* chat

    // Save the *new* empty history state for this persona immediately
    // This makes `loadActiveChatState` find this persona even with empty history
    // when returning to the app later in the session.
    saveActiveChatState();


    // Update chat header
    currentPersonaSpan.textContent = persona.name;

    // Clear previous messages and show initial state message
    chatbox.innerHTML = ''; // Clear chatbox before rendering history
     renderChatHistory(appState.conversationHistory); // Render empty history + initial message

    // Enable input and send button only if API key is valid (initial check)
    // Use the statically imported GOOGLE_API_KEY
     const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');

     if (isApiKeyValid) {
         userInput.disabled = false;
         sendButton.disabled = false;
         userInput.focus(); // Focus the input
     } else {
         console.warn("Chat input disabled because API Key is not configured.");
         // Display API key message if the chat view is about to be shown
         if (appState.currentState === 'chat') { // Only display if we are actually showing chat
             displayBotMessage("API Key is not configured. Chat functionality is disabled."); // No typing indicator for this message
         }
         userInput.disabled = true;
         sendButton.disabled = true;
     }


    // Smooth transition to chat view
    showView('chat');

     // Initial scroll to bottom (redundant after renderChatHistory?)
     // scrollToBottom();

     announce(`Chat started with ${persona.name}.`); // Announce for screen readers
};


// Function to go back to persona selection
// TODO: This needs modification for Feature 4 (multiple chats)
export const goBackToPersonas = () => {
    // --- NEW: Save current chat state before leaving ---
    saveActiveChatState();
    // Note: In Feature 4, saveActiveChatState might just update state without clearing persona/history immediately

    appState.selectedPersona = null; // Clear selected persona *after* saving its state
    appState.conversationHistory = []; // Clear history *after* saving

    // Smooth transition back to persona selection view
    showView('persona-selection');

    // Clear chatbox content when leaving chat (it's now empty due to state clear)
    chatbox.innerHTML = '';


    // Disable input and send button
    userInput.disabled = true;
    sendButton.disabled = true;

    // Re-render the grid based on the current filter/search (if any)
    filterAndRenderPersonas(); // This will use the current state of selectedFilters and currentSearchTerm

     // Attempt to focus the search input after going back
    setTimeout(() => {
        const personaSearchInput = document.getElementById('persona-search'); // Get reference here
        if (personaSearchInput) personaSearchInput.focus();
    }, 100);

    announce('Returned to persona selection.'); // Announce for screen readers
};

// Function to clear the chat history for the current persona
// TODO: This needs modification for Feature 4 (multiple chats)
export const clearChatHistory = () => {
    if (!appState.selectedPersona) return; // Should not happen if button is only visible in chat

    appState.conversationHistory = []; // Clear the history array
    // --- NEW: Also clear the saved chat state from session storage ---
    saveActiveChatState(); // Calling save with empty history will clear it

     // Display initial message again
     chatbox.innerHTML = ''; // Clear chatbox before rendering
     renderChatHistory(appState.conversationHistory); // Renders empty history + initial message

     console.log('Chat history cleared.');
     // Attempt to focus input if enabled (depends on API key status)
     // Use the statically imported GOOGLE_API_KEY
      const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');
      if (!userInput.disabled && isApiKeyValid) { // Check global disabled state and API key
          userInput.focus();
      }


     announce('Chat history cleared.');
};