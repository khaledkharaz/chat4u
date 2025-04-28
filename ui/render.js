// / --- UI Rendering Logic ---
// Functions to create or update DOM elements based on data and state.

import {
    personaGridDiv,
    chatbox,
    filterCheckboxes,
    createAriaStatusElement
} from '../js/domElements.js';
 import { appState } from '../js/state.js';


// Utility function for ARIA status announcements
const ariaStatus = createAriaStatusElement(); // Ensure the element exists

export const announce = (text) => {
    // Clear previous announcement to ensure new one is read
    ariaStatus.textContent = '';
    // Set timeout to allow screen reader to process previous state change if any
    setTimeout(() => {
        ariaStatus.textContent = text;
    }, 100);
};


// Function to create a single persona card element
export const createPersonaCard = (persona) => {
    const card = document.createElement('button'); // Use button for accessibility
    card.classList.add('persona-card');
    card.dataset.key = persona.key; // Store the key on the element

    // Ensure persona.types and persona.categories are arrays before mapping
    // Combine types and categories for tag display
    const allTags = [...(persona.types || []), ...(persona.categories || [])];
    const tagsHtml = allTags.map(tag =>
         `<span class="tag">${tag.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`
        ).join('');

    card.innerHTML = `
        <h3>${persona.name}</h3>
        ${allTags.length > 0 ? `<div class="persona-tags">${tagsHtml}</div>` : ''}
    `;
    return card;
};

// Function to render the grid of persona cards
export const renderPersonaGrid = (personasToDisplay) => {
    personaGridDiv.innerHTML = ''; // Clear current grid

    // Update ARIA status - Announce results after filtering/rendering
    let statusElement = document.getElementById('grid-status'); // Get the element created in domElements
     if (!statusElement) {
          statusElement = createAriaStatusElement(); // Fallback, though it should exist from domElements
          statusElement.id = 'grid-status'; // Give it the specific ID for grid status
     }

    if (personasToDisplay.length === 0) {
         const emptyMessage = document.createElement('p');
         emptyMessage.classList.add('empty-grid-message');
         emptyMessage.textContent = 'No personas match your criteria.';
         personaGridDiv.appendChild(emptyMessage);
         // Announce to screen readers
         statusElement.textContent = 'No personas match your criteria.';

    } else {
         const resultCount = personasToDisplay.length;
         const announcement = resultCount === 1 ? '1 persona found.' : `${resultCount} personas found.`;
         statusElement.textContent = announcement; // Set announcement text


        personasToDisplay.forEach(persona => {
            const card = createPersonaCard(persona);
            personaGridDiv.appendChild(card);
        });
    }
};


// Function to display a user message in the chatbox
export const displayUserMessage = (text) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = text;
    chatbox.appendChild(messageElement);
    // No need for aria-live on individual messages if role="log" is on container
};

// Function to display a bot message in the chatbox
export const displayBotMessage = (text, isTypingIndicator = false) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');

    if (isTypingIndicator) {
        messageElement.classList.add('typing');
         messageElement.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
         // Add a descriptive aria-label for screen readers during typing
         messageElement.setAttribute('aria-label', 'AI is typing');
         // Add role="status" for automatic announcement by screen readers when it appears
         messageElement.setAttribute('role', 'status');
         messageElement.setAttribute('aria-live', 'polite'); // Explicitly polite
    } else {
        messageElement.textContent = text;
         // Remove aria-label and role for actual message content, aria-live handled by container
         messageElement.removeAttribute('aria-label');
         messageElement.removeAttribute('role');
         messageElement.removeAttribute('aria-live');
    }
    chatbox.appendChild(messageElement);
    return messageElement; // Return element to allow removing indicator
};

// Function to scroll the chatbox to the bottom
export const scrollToBottom = () => {
    // Use a slight timeout to ensure DOM update happens before scrolling
    setTimeout(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
    }, 50);
};


// Helper function to render messages from history array into the chatbox
export const renderChatHistory = (history) => {
    chatbox.innerHTML = ''; // Clear current chatbox content
    if (history.length === 0) {
        // Show initial message if history is empty
         displayBotMessage(`You are now chatting with ${appState.selectedPersona.name}. Say hello!`, false);
    } else {
        history.forEach(message => {
             if (message.role === 'user') {
                 displayUserMessage(message.parts[0].text);
             } else if (message.role === 'model') {
                 displayBotMessage(message.parts[0].text, false);
             }
        });
    }
    scrollToBottom(); // Scroll to the end after rendering
};


// Function to update filter checkboxes based on the `appState.selectedFilters` array
export const updateFilterCheckboxes = () => {
     filterCheckboxes.forEach(checkbox => {
         const isSelected = appState.selectedFilters.includes(checkbox.value);
         checkbox.checked = isSelected;
         // Update ARIA selected state for associated label
         const label = document.querySelector(`label[for="${checkbox.id}"]`);
         if (label) {
              label.setAttribute('aria-selected', isSelected ? 'true' : 'false');
         }
     });
     // Double-check ARIA for 'all' specifically
      const allCheckbox = document.getElementById('filter-all');
      const allLabel = document.querySelector('label[for="filter-all"]');
      if (allCheckbox && allLabel) {
           allLabel.setAttribute('aria-selected', allCheckbox.checked ? 'true' : 'false');
      }
};


// Theme application logic (moved from main for better organization)
export const applyTheme = (theme) => {
     const body = document.body; // Use direct access here as it's specific to body class
     const darkModeToggle = document.getElementById('dark-mode-toggle'); // Get button reference here

    if (theme === 'dark') {
        body.classList.add('dark-mode');
         darkModeToggle.setAttribute('aria-label', 'Toggle Light Mode');
    } else {
        body.classList.remove('dark-mode');
         darkModeToggle.setAttribute('aria-label', 'Toggle Dark Mode');
    }
};