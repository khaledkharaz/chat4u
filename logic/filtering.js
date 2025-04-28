// --- Persona Filtering & Search Logic ---

import { allPersonas } from '../js/data/personas.js'; // Need the raw data
import { appState } from '../js/state.js';

 import { renderPersonaGrid, updateFilterCheckboxes, announce } from '../ui/render.js'; // Need rendering functions
import { personaSearchInput, filterCheckboxes } from '../js/domElements.js'; // Need DOM elements for values/state
import { saveState } from '../js/persistence.js'; // Need to save state after filter/search changes


// Function to filter and render personas based on current filter and search term
// Reads from appState.selectedFilters and appState.currentSearchTerm
export const filterAndRenderPersonas = () => {
    // Ensure this only runs if the main app content is visible (or handle hiding/showing results)
    // The auth logic ensures this is called only when unlocked or loading unlocked state.
     if (document.body.classList.contains('locked')) {
         // Maybe render an empty grid or a message indicating it's locked?
         renderPersonaGrid([]); // Or a specific "App is locked" message
         return; // Don't perform actual filtering
     }


    const searchTerm = appState.currentSearchTerm.toLowerCase(); // Use state value

    const filtered = allPersonas.filter(persona => {
        // Ensure persona.types and persona.categories are arrays for safety
        const personaTags = [...(persona.types || []), ...(persona.categories || [])]; // Combine for easier checking

        // --- Feature 1: Multi-select Filter Logic (AND logic) ---
        let passesFilter = false;

        // If 'all' is explicitly selected OR if no filters are selected at all, show all
        // Note: appState.selectedFilters = [] is now the representation of 'show all' when 'all' isn't checked.
        if (appState.selectedFilters.includes('all') || appState.selectedFilters.length === 0) {
             passesFilter = true;
        } else {
             // If specific filters are selected, the persona must match *EVERY* selected filter
             passesFilter = appState.selectedFilters.every(filterValue => {
                 // The filterValue must be present in the persona's combined tags (types + categories)
                 return personaTags.includes(filterValue);
             });
        }
        // --- End Multi-select Filter Logic ---

        // Filter by Search Term (check name and combined tags)
        const searchTermMatch = persona.name.toLowerCase().includes(searchTerm) ||
                                personaTags.some(tag => tag.toLowerCase().includes(searchTerm));


        return passesFilter && searchTermMatch; // Combine filter and search (both must be true)
    });

    renderPersonaGrid(filtered);
};


// Function to handle changes to the filter checkboxes
export const handleFilterChange = (event) => {
    // Ensure filters are only interactive when unlocked
    if (document.body.classList.contains('locked')) {
         console.warn("Attempted to change filters while app is locked.");
         // Revert the checkbox change if clicked while locked
         if (event.target.type === 'checkbox') {
             event.target.checked = !event.target.checked;
         }
        return;
    }

    if (event.target.type === 'checkbox' && event.target.name === 'persona-type') {
        const clickedValue = event.target.value;
        const isChecked = event.target.checked;

        // --- Logic to determine the NEW selectedFilters array ---
        let tempSelectedFilters = [];
        filterCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                tempSelectedFilters.push(checkbox.value);
            }
        });

        // Special handling for the 'all' checkbox
        if (clickedValue === 'all') {
            if (isChecked) {
                // If 'all' was checked, the selection is just ['all']
                appState.selectedFilters = ['all'];
            } else {
                // If 'all' was unchecked, and it was the *only* thing checked,
                // the selection becomes empty. An empty array means "show all" in our filter logic.
                // If other things were *also* checked when 'all' was unchecked,
                // tempSelectedFilters already contains them, and the logic below will handle it.
                if (tempSelectedFilters.length === 0) {
                     appState.selectedFilters = []; // Explicitly empty if nothing is checked
                } else {
                    // If 'all' was unchecked but other boxes *are* checked, keep the other boxes
                    appState.selectedFilters = tempSelectedFilters.filter(val => val !== 'all');
                }
            }
        } else { // Handling non-'all' checkboxes
            if (isChecked) {
                // If a non-'all' is checked, remove 'all' from the logical selection
                appState.selectedFilters = tempSelectedFilters.filter(val => val !== 'all');
            } else {
                // If a non-'all' is unchecked, just remove it from the current selection
                appState.selectedFilters = appState.selectedFilters.filter(val => val !== clickedValue);

                // If unchecking this box results in NO non-'all' boxes being selected,
                // implicitly go back to 'all' state (empty array)
                const anyNonAllSelected = appState.selectedFilters.some(val => val !== 'all');
                if (!anyNonAllSelected && !appState.selectedFilters.includes('all')) {
                      appState.selectedFilters = []; // Stick to empty array for 'show all'
                }
            }
        }

        // After updating selectedFilters, sync the *visual* state of checkboxes
        updateFilterCheckboxes(); // Call rendering function

        console.log("Selected filters:", appState.selectedFilters); // Log state
        filterAndRenderPersonas(); // Filter and re-render the grid (Calls renderPersonaGrid internally)

         // Announce filter change - use target label text
         const label = document.querySelector(`label[for="${event.target.id}"]`);
         if (label) {
              announce(`Filter ${label.textContent} ${isChecked ? 'selected' : 'deselected'}.`);
         }


        // Save the updated filter state to localStorage
        saveState();

    }
};


// Function to handle input in the search box
export const handleSearchInput = (event) => {
    // Ensure search is only interactive when unlocked
    if (document.body.classList.contains('locked')) {
         console.warn("Attempted to search while app is locked.");
         event.target.value = ''; // Clear input
         return;
    }
    appState.currentSearchTerm = event.target.value; // Update state
    filterAndRenderPersonas(); // Filter and re-render (Calls renderPersonaGrid internally)
    // ARIA status updates handled in renderPersonaGrid
     // Announce search input value, but keep it concise or only announce the change.
     // Announcing on every input can be noisy for screen readers.
     // A common pattern is to announce results after a short delay, or only announce the final search term.
     // For now, commenting out frequent announcements.
     // announce(`Search term: ${appState.currentSearchTerm}`);
};