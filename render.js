// --- UI Rendering Logic ---
// Functions to create or update DOM elements based on data and state.

import {
    personaGridDiv, // For rendering persona cards grid
    chatbox, // For displaying chat messages
    filterCheckboxes, // For updating filter checkbox state
    createAriaStatusElement, // To create the ARIA status element if needed
    personaManagementList, // Container for management list items
    personaFormModal, // The form modal element
    personaFormTitle, // Form title
    formPersonaKey, // Form inputs
    formPersonaName,
    formPersonaInstruction,
    formPersonaTypes,
    formPersonaCategories,
    personaForm // Need the form element itself for reset
} from './domElements.js'; // Path changes to ../js/

 import { appState } from './state.js'; // Path changes to ../js/

import { announce } from './domElements.js'; // Use announce from domElements.js as provided


// Utility function for ARIA status announcements (element creation)
// The createAriaStatusElement function is in domElements and used by announce.
// No need to call it or define ariaStatus here.


// Function to create a single persona card element (for the main selection grid)
export const createPersonaCard = (persona) => {
    const card = document.createElement('button');
    card.classList.add('persona-card');
    card.dataset.key = persona.key;

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

// Function to render the grid of persona cards (for the main selection view)
export const renderPersonaGrid = (personasToDisplay) => {
    // This function is called by filterAndRenderPersonas, which checks the state.
    // Still add defensive check for the DOM element just in case.
    if (personaGridDiv) {
        personaGridDiv.innerHTML = '';

        // Update ARIA status - Announce results after filtering/rendering
        // This element is created once in domElements.js
        let statusElement = document.getElementById('grid-status');
         if (!statusElement) {
              statusElement = createAriaStatusElement();
              statusElement.id = 'grid-status';
         }


        if (personasToDisplay.length === 0) {
             const emptyMessage = document.createElement('p');
             emptyMessage.classList.add('empty-grid-message');
             emptyMessage.textContent = 'No personas match your criteria.';
             personaGridDiv.appendChild(emptyMessage);
             statusElement.textContent = 'No personas match your criteria.';

        } else {
             const resultCount = personasToDisplay.length;
             const announcement = resultCount === 1 ? '1 persona found.' : `${resultCount} personas found.`;
             statusElement.textContent = announcement;

            personasToDisplay.forEach(persona => {
                const card = createPersonaCard(persona);
                personaGridDiv.appendChild(card);
            });
        }
    }
};


// --- Persona Management Rendering ---

// Function to create a single persona item for the management list
export const createManagementPersonaItem = (persona) => {
    const item = document.createElement('div');
    item.classList.add('management-persona-item');
    item.dataset.key = persona.key;

    const types = (persona.types || []).map(t => t.trim().replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())).filter(t => t.length > 0).join(', ');
    const categories = (persona.categories || []).map(c => c.trim().replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())).filter(c => c.length > 0).join(', ');


    item.innerHTML = `
        <h4>${persona.name}</h4>
        <p><strong>Key:</strong> ${persona.key}</p>
        ${types ? `<p><strong>Types:</strong> ${types}</p>` : ''}
        ${categories ? `<p><strong>Categories:</strong> ${categories}</p>` : ''}
        <p class="instruction-preview">${persona.instruction.substring(0, 100)}${persona.instruction.length > 100 ? '...' : ''}</p>
        <div class="item-actions">
            <button class="edit-persona-button" data-key="${persona.key}" aria-label="Edit ${persona.name}">Edit</button>
            <button class="delete-persona-button" data-key="${persona.key}" aria-label="Delete ${persona.name}">Delete</button>
        </div>
    `;
    return item;
};

// Function to render the list of personas in the management view
export const renderPersonaManagementList = (personasToDisplay) => {
     // This function is called by showView('persona-management'), which checks the state.
     // Still add defensive check for the DOM element just in case.
     if (personaManagementList) {
         personaManagementList.innerHTML = '';

         if (personasToDisplay.length === 0) {
              const emptyMessage = document.createElement('p');
              emptyMessage.classList.add('empty-list-message');
              emptyMessage.textContent = 'No personas added yet.';
              personaManagementList.appendChild(emptyMessage);
         } else {
             personasToDisplay.forEach(persona => {
                 const item = createManagementPersonaItem(persona);
                 personaManagementList.appendChild(item);
             });
         }
     }
};

// Function to show the persona form modal (for add/edit)
export const showPersonaForm = (persona = null) => {
    // This function is called by ui/personaManagement.js listeners, which check state.
    // Still add defensive check for the DOM elements just in case.
    if (personaFormModal && personaForm && personaFormTitle && formPersonaKey && formPersonaName && formPersonaInstruction && formPersonaTypes && formPersonaCategories) {
        if (persona) {
            personaFormTitle.textContent = `Edit Persona: ${persona.name}`;
            formPersonaKey.value = persona.key;
            formPersonaName.value = persona.name;
            formPersonaInstruction.value = persona.instruction;
            formPersonaTypes.value = (persona.types || []).join(', ');
            formPersonaCategories.value = (persona.categories || []).join(', ');

        } else {
            personaFormTitle.textContent = 'Add New Persona';
            formPersonaKey.value = '';
            personaForm.reset();
        }

        personaFormModal.classList.remove('hidden');
        personaFormModal.setAttribute('aria-hidden', 'false');
        formPersonaName.focus();
    } else {
        console.error("Failed to show persona form: Missing DOM elements.");
        announce("Error displaying persona form.");
    }
};

// Function to hide the persona form modal
export const hidePersonaForm = () => {
    // This function is called by ui/personaManagement.js listeners.
    // Still add defensive check for the DOM elements just in case.
    if (personaFormModal && personaForm && formPersonaKey) {
        personaFormModal.classList.add('hidden');
        personaFormModal.setAttribute('aria-hidden', 'true');
        personaForm.reset();
        formPersonaKey.value = '';
         // Attempt to return focus to the button that opened the modal (add or edit)
         // This is tricky with delegation. Could add a state property to track the last focused button.
         // For now, we won't attempt to return focus automatically on close.
    } else {
        console.error("Failed to hide persona form: Missing DOM elements.");
    }
};


// --- Chat Rendering ---

export const displayUserMessage = (text) => {
    if (chatbox) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = text;
        chatbox.appendChild(messageElement);
    }
};

export const displayBotMessage = (text, isTypingIndicator = false) => {
    if (chatbox) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message');

        if (isTypingIndicator) {
            messageElement.classList.add('typing');
             messageElement.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
             messageElement.setAttribute('aria-label', 'AI is typing');
             messageElement.setAttribute('role', 'status');
             messageElement.setAttribute('aria-live', 'polite');
        } else {
            messageElement.textContent = text;
             messageElement.removeAttribute('aria-label');
             messageElement.removeAttribute('role');
             messageElement.removeAttribute('aria-live');
        }
        chatbox.appendChild(messageElement);
        return messageElement;
    }
    return null;
};

export const scrollToBottom = () => {
    if (chatbox) {
        setTimeout(() => {
            chatbox.scrollTop = chatbox.scrollHeight;
        }, 50);
    }
};

export const renderChatHistory = (history) => {
    if (chatbox && appState.selectedPersona) {
        chatbox.innerHTML = '';
        if (history.length === 0) {
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
        scrollToBottom();
    }
};

export const updateFilterCheckboxes = () => {
     if (filterCheckboxes) {
         filterCheckboxes.forEach(checkbox => {
             const isSelected = appState.selectedFilters.includes(checkbox.value);
             checkbox.checked = isSelected;
             const label = document.querySelector(`label[for="${checkbox.id}"]`);
             if (label) {
                  label.setAttribute('aria-selected', isSelected ? 'true' : 'false');
             }
         });
     }
      const allCheckbox = document.getElementById('filter-all');
      const allLabel = document.querySelector('label[for="filter-all"]');
      if (allCheckbox && allLabel) {
           allLabel.setAttribute('aria-selected', allCheckbox.checked ? 'true' : 'false');
      }
};

export const applyTheme = (theme) => {
     const body = document.body;
     const darkModeToggle = document.getElementById('dark-mode-toggle');

    if (theme === 'dark') {
        body.classList.add('dark-mode');
         if (darkModeToggle) darkModeToggle.setAttribute('aria-label', 'Toggle Light Mode');
    } else {
        body.classList.remove('dark-mode');
         if (darkModeToggle) darkModeToggle.setAttribute('aria-label', 'Toggle Dark Mode');
    }
};