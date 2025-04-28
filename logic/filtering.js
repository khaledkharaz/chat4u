
// --- Persona Filtering & Search Logic ---

import { appState } from '../js/state.js'; // Path changes to ../js/

import { renderPersonaGrid, updateFilterCheckboxes } from '../js/render.js'; // Path changes to ../ui/, announce is in domElements
import { announce } from '../js/domElements.js'; // Use announce from domElements.js as provided

import { personaSearchInput, filterCheckboxes } from '../js/domElements.js'; // Path changes to ../js/
import { saveState } from '../js/persistence.js'; // Path changes to ../js/


// Function to filter and render personas based on current filter and search term
export const filterAndRenderPersonas = () => {
    // Ensure this only runs if the app is unlocked and in the persona selection view
     if (appState.isLocked || appState.currentState !== 'persona-selection') { // Use state properties
         // If not in the correct state/view, clear the grid or show empty
         renderPersonaGrid([]); // Render an empty grid
         return;
     }

    const personasToFilter = appState.allPersonasMutable; // USE MUTABLE LIST

    const searchTerm = appState.currentSearchTerm.toLowerCase();

    const filtered = personasToFilter.filter(persona => {
        const personaTags = [...(persona.types || []), ...(persona.categories || [])];

        let passesFilter = false;
        if (appState.selectedFilters.includes('all') || appState.selectedFilters.length === 0) {
             passesFilter = true;
        } else {
             passesFilter = appState.selectedFilters.every(filterValue => {
                 return personaTags.includes(filterValue);
             });
        }

        const searchTermMatch = persona.name.toLowerCase().includes(searchTerm) ||
                                personaTags.some(tag => tag.toLowerCase().includes(searchTerm));


        return passesFilter && searchTermMatch;
    });

    renderPersonaGrid(filtered); // Call rendering function
};


// Function to handle changes to the filter checkboxes
export const handleFilterChange = (event) => {
    // Ensure filters are only interactive when unlocked and on persona selection view
    if (appState.isLocked || appState.currentState !== 'persona-selection') { // Use state properties
         console.warn("Attempted to change filters while app is locked or not on persona selection view.");
         if (event.target && event.target.type === 'checkbox') {
             event.target.checked = !event.target.checked;
         }
        return;
    }

    if (event.target && event.target.type === 'checkbox' && event.target.name === 'persona-type') {
        const clickedValue = event.target.value;
        const isChecked = event.target.checked;

        let tempSelectedFilters = [];
        if (filterCheckboxes) {
            filterCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    tempSelectedFilters.push(checkbox.value);
                }
            });
        }

        if (clickedValue === 'all') {
            if (isChecked) {
                appState.selectedFilters = ['all'];
            } else {
                if (tempSelectedFilters.length === 0) {
                     appState.selectedFilters = [];
                } else {
                    appState.selectedFilters = tempSelectedFilters.filter(val => val !== 'all');
                }
            }
        } else { // Handling non-'all' checkboxes
            if (isChecked) {
                appState.selectedFilters = tempSelectedFilters.filter(val => val !== 'all');
            } else {
                appState.selectedFilters = appState.selectedFilters.filter(val => val !== clickedValue);

                const anyNonAllSelected = appState.selectedFilters.some(val => val !== 'all' && val !== '');
                if (!anyNonAllSelected && !appState.selectedFilters.includes('all')) {
                      appState.selectedFilters = [];
                }
            }
        }

        updateFilterCheckboxes(); // Call rendering function

        console.log("Selected filters:", appState.selectedFilters);
        filterAndRenderPersonas(); // Filter and re-render the grid

         const label = document.querySelector(`label[for="${event.target.id}"]`);
         if (label) {
              announce(`Filter ${label.textContent} ${isChecked ? 'selected' : 'deselected'}.`);
         }

        saveState();
    }
};


// Function to handle input in the search box
export const handleSearchInput = (event) => {
    // Ensure search is only interactive when unlocked and on persona selection view
    if (appState.isLocked || appState.currentState !== 'persona-selection') {
         console.warn("Attempted to search while app is locked or not on persona selection view.");
         if (event.target) event.target.value = '';
         return;
    }
    if (event.target) appState.currentSearchTerm = event.target.value;
    filterAndRenderPersonas();
};