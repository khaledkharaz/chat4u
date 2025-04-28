// --- Persona Management UI Logic ---
// Handles rendering the persona management view and attaching its event listeners.

import {
    personaManagementList, // List container
    addPersonaButton, // Add button
    backFromManagementButton, // Back button
    personaFormModal, // Form modal
    personaForm, // Form element
    personaFormTitle, // Form title
    formPersonaKey, // Form inputs
    formPersonaName,
    formPersonaInstruction,
    formPersonaTypes,
    formPersonaCategories,
    cancelFormButton // Cancel button
} from '../js/domElements.js'; // Path changes to ../js/

import { appState } from '../js/state.js'; // Path changes to ../js/

import {
    renderPersonaManagementList, // Rendering function for the list
    showPersonaForm, // Function to show the form modal
    hidePersonaForm, // Function to hide the form modal
    createManagementPersonaItem // Function to create list item HTML
} from './render.js'; // Path remains ./ (within ui/)

import { announce } from '../js/domElements.js'; // Use announce from domElements.js as provided

import {
    savePersona, // Logic function to save persona
    deletePersona, // Logic function to delete persona
    getPersonaByKey // Logic function to get persona by key
} from '../logic/personaManagement.js'; // Path changes to ../logic/

import { showPersonaManagementView, goBackToPersonas } from './viewManager.js'; // Path remains ./ (within ui/) // Need view switching functions


// Function to initialize listeners for the persona management view and form
export const setupPersonaManagementListeners = () => {

    // Listener for the "Add New Persona" button
    if (addPersonaButton) { // Add defensive check
        addPersonaButton.addEventListener('click', () => {
            showPersonaForm(); // Show empty form for adding
        });
    }

    // Listener for the "Back" button in the management view
    if (backFromManagementButton) { // Add defensive check
        backFromManagementButton.addEventListener('click', () => {
            goBackToPersonas(); // Go back to the main persona selection grid
        });
    }


    // Listener for the Edit/Delete buttons using delegation on the list container
    if (personaManagementList) { // Add defensive check
        personaManagementList.addEventListener('click', (event) => {
            const editButton = event.target.closest('.edit-persona-button');
            const deleteButton = event.target.closest('.delete-persona-button');

            if (editButton) {
                const key = editButton.dataset.key;
                const personaToEdit = getPersonaByKey(key); // Call logic function
                if (personaToEdit) {
                    showPersonaForm(personaToEdit); // Show form populated with persona data
                } else {
                    announce(`Error: Persona with key ${key} not found.`);
                }
            } else if (deleteButton) {
                const key = deleteButton.dataset.key;
                // Confirm deletion
                if (confirm('Are you sure you want to delete this persona?')) {
                    deletePersona(key); // Call logic function
                    // Re-rendering of the list and main grid is handled within deletePersona
                }
            }
        });
    }


    // Listener for the Persona Add/Edit Form submission
    if (personaForm) { // Add defensive check
        personaForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const formData = {
                key: formPersonaKey ? formPersonaKey.value : '', // Add defensive checks
                name: formPersonaName ? formPersonaName.value.trim() : '',
                instruction: formPersonaInstruction ? formPersonaInstruction.value.trim() : '',
                types: formPersonaTypes ? formPersonaTypes.value.trim() : '',
                categories: formPersonaCategories ? formPersonaCategories.value.trim() : ''
            };

            const success = savePersona(formData); // Call logic function

            if (success) {
                 hidePersonaForm(); // Hide the form on successful save
            }
            // If not successful (e.g., validation failed), the form remains open,
            // and savePersona announces the error.
        });
    }

    // Listener for the form's Cancel button
    if (cancelFormButton) { // Add defensive check
         cancelFormButton.addEventListener('click', hidePersonaForm);
    }

    // Optional: Close modal if clicking outside the modal content (requires CSS)
    if (personaFormModal) { // Add defensive check
        personaFormModal.addEventListener('click', (event) => {
             // Check if the click target is the modal background itself, not descendants
             if (event.target === personaFormModal) {
                  hidePersonaForm();
             }
        });
    }
};

// This function might be called from main.js when switching to this view
// It ensures the list is updated with the latest state
// export const updateManagementView = () => {
//      renderPersonaManagementList(appState.allPersonasMutable);
// };
// Note: updateManagementView is no longer strictly needed as showView calls renderPersonaManagementList directly