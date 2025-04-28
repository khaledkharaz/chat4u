
import {
    body, // Used for body.classList (implicitly via auth functions calling showView)
    mainAppContentDiv, // The wrapper for the main app content views
    // homeScreenDiv is NOT managed by showView anymore
    personaSelectionDiv, // Persona selection view
    chatContainerDiv, // Chat view
    personaManagementDiv, // Management view element
    currentPersonaSpan, // Span for current persona name in chat header
    userInput, // Chat input field
    sendButton, // Send button
    chatbox // Chat messages container
    // revealPasswordButton, unlockSectionDiv etc. are not managed by showView
} from './domElements.js'; // Path changes to ../js/
 import { appState } from './state.js'; // Path changes to ../js/

import { saveActiveChatState, loadActiveChatState } from './persistence.js'; // Path changes to ../js/
import { renderChatHistory, displayBotMessage, scrollToBottom } from './render.js'; // Path remains ./ (within ui/)
import { announce } from './domElements.js'; // Use announce from domElements.js as provided

import { renderPersonaManagementList } from './render.js'; // Import rendering function for management list

import { filterAndRenderPersonas } from '../logic/filtering.js'; // Path changes to ../logic/
import { GOOGLE_API_KEY } from './config.js'; // Path changes to ../js/


// Function to switch visible view with transition
// This function manages which 'view' element *inside* #main-app-content is visible.
// The 'locked' state and visibility of #lock-screen vs #main-app-content is managed by auth.js.
export const showView = (viewName) => {
    // This function should *only* be called when appState.isLocked is false.
    // Add a defensive check here.
     if (appState.isLocked) {
         console.warn(`Attempted to show view '${viewName}' while app is locked.`);
         // Maybe try to navigate to the lock screen? No, that could cause a loop.
         // Just prevent the view change.
         return;
     }

    // Validate viewName - 'home' is NOT a valid view for this function anymore
    const validViews = ['persona-selection', 'chat', 'persona-management'];
    if (!validViews.includes(viewName)) {
        console.error(`Invalid view name: ${viewName}. Must be one of ${validViews.join(', ')} when unlocked.`);
        // Revert to a default valid view if an invalid one is requested while unlocked?
        // showView('persona-selection'); // Optional: Fallback
        return;
    }

    // Update state
    appState.currentState = viewName;
    console.log(`Showing view: ${viewName}`);


    // Manage visibility of views *inside* main-app-content
    const viewsInsideMain = mainAppContentDiv ? mainAppContentDiv.querySelectorAll('.view') : [];
    viewsInsideMain.forEach(view => {
        let targetViewElement = null;
        if (viewName === 'chat') targetViewElement = chatContainerDiv;
        else if (viewName === 'persona-selection') targetViewElement = personaSelectionDiv;
        else if (viewName === 'persona-management') targetViewElement = personaManagementDiv;

        if (view === targetViewElement) {
             view.classList.remove('hidden');
             view.setAttribute('aria-hidden', 'false');
        } else {
             view.classList.add('hidden');
             view.setAttribute('aria-hidden', 'true');
        }
    });


     // Additional actions based on the view being shown (rendering, focus, state cleanup)

     if (viewName === 'persona-selection') {
          // Disable chat input when leaving chat view
          if (userInput) userInput.disabled = true;
          if (sendButton) sendButton.disabled = true;
          if (chatbox) chatbox.innerHTML = ''; // Clear chatbox content when navigating away from chat
          appState.selectedPersona = null; // Ensure these are cleared when leaving chat/management
          appState.conversationHistory = []; // Ensure these are cleared when leaving chat/management

          // Re-render the grid when returning to selection view
          filterAndRenderPersonas(); // This logic checks appState.currentState internally now

          // Attempt to focus search input
           setTimeout(() => {
               const personaSearchInput = document.getElementById('persona-search');
               if (personaSearchInput) personaSearchInput.focus();
           }, 100);


     } else if (viewName === 'chat') {
          // Render chat history when entering chat view
          renderChatHistory(appState.conversationHistory);

           // Re-check API key status and enable input if valid
           const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');
           // Check appState.isLocked as well (should be false here due to defensive check at top)
           if (isApiKeyValid) {
               if (userInput) userInput.disabled = false;
               if (sendButton) sendButton.disabled = false;
               if (userInput) userInput.focus(); // Focus input on view change
           } else {
               console.warn("Chat input disabled due to missing/invalid API key.");
               if (userInput) userInput.disabled = true;
               if (sendButton) sendButton.disabled = false;
                if (chatbox && chatbox.children.length === 0) {
                     displayBotMessage("API Key is not configured. Chat functionality is disabled.", false);
                }
           }
           // Scroll to bottom after rendering history
           scrollToBottom();


     } else if (viewName === 'persona-management') {
          // Render the persona management list when entering this view
          renderPersonaManagementList(appState.allPersonasMutable);

          // Disable chat input
          if (userInput) userInput.disabled = true;
          if (sendButton) sendButton.disabled = true;
          if (chatbox) chatbox.innerHTML = ''; // Clear chatbox content
           appState.selectedPersona = null; // Ensure these are cleared
           appState.conversationHistory = []; // Ensure these are cleared

          // Attempt to focus the Add Persona button
           setTimeout(() => {
               const addPersonaButton = document.getElementById('add-persona-button');
               if (addPersonaButton) addPersonaButton.focus();
           }, 100);
     }
     // No 'home' view logic here
};


// Function to handle starting a chat (called when a card is clicked)
export const startChat = (persona) => {
    // Ensure action is only possible when unlocked and on persona selection view
     if (appState.isLocked || appState.currentState !== 'persona-selection') {
         console.warn("Attempted to start chat while app is locked or not on persona selection view.");
         return;
     }

    if (!persona) {
        console.error("No persona provided to startChat.");
        return;
    }

    // Save state before changing view/persona
    saveActiveChatState();

    // Update state for the NEW chat
    appState.selectedPersona = persona;
    appState.conversationHistory = []; // Always clear history for a *new* chat

    // Save the new empty chat state immediately so it can be resumed
    saveActiveChatState();

    // Update UI (header)
    if (currentPersonaSpan) currentPersonaSpan.textContent = persona.name;

    // Transition to chat view (showView handles rendering history, input state, focus)
    showView('chat');

    announce(`Chat started with ${persona.name}.`);
};


// Function to go back to persona selection
export const goBackToPersonas = () => {
    // Ensure action is only possible when unlocked and not on home screen (which doesn't exist as a view name here)
     if (appState.isLocked) {
         console.warn("Attempted to go back to personas while app is locked.");
         return;
     }

    // Save current chat state before leaving
    saveActiveChatState();

    // selectedPersona and conversationHistory are cleared in showView('persona-selection') now

    // Transition to persona selection view (showView handles UI update, re-rendering grid, focus)
    showView('persona-selection');

    // Re-render the grid (called by showView)
    // filterAndRenderPersonas();

    // Focus search input (called by showView)
     // setTimeout(() => { ... }, 100);

    announce('Returned to persona selection.');
};


// Function to go to the persona management view (called from main.js button)
// This button should only be visible when unlocked and on persona selection view via CSS
// Add an extra check here for safety.
export const showPersonaManagementView = () => {
     // Ensure action is only possible when unlocked and on persona selection view
     if (appState.isLocked || appState.currentState !== 'persona-selection') {
         console.warn("Attempted to go to persona management while app is locked or not on persona selection view.");
         return;
     }

    // Save the current chat state before going to management
    saveActiveChatState();
    // selectedPersona and conversationHistory are cleared in showView('persona-management') now

    // Transition to management view (showView handles rendering list, focus)
    showView('persona-management');

    announce('Showing persona management.');
}


// Function to clear the chat history for the current persona
export const clearChatHistory = () => {
    // Ensure action is only possible when unlocked and in chat view
    if (appState.isLocked || appState.currentState !== 'chat') {
        console.warn("Attempted to clear chat history while app is locked or not in chat view.");
        announce("Cannot clear chat history now.");
        return;
    }

    if (!appState.selectedPersona) return;

    appState.conversationHistory = [];
    saveActiveChatState(); // Calling save with empty history will clear it from session storage

     renderChatHistory(appState.conversationHistory); // Re-render chatbox

     console.log('Chat history cleared.');

      const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');
      // Check appState.isLocked as well (should be false here)
      if (userInput && !userInput.disabled && !appState.isLocked && isApiKeyValid) {
          userInput.focus();
      }

     announce('Chat history cleared.');
};