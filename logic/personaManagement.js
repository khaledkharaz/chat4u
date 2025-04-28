// --- Core Persona Management Logic (CRUD) ---
// Handles adding, editing, and deleting personas.

import { appState } from '../js/state.js'; // Path changes to ../js/
import { savePersonas } from '../js/persistence.js'; // Path changes to ../js/ // Need to save changes
import { renderPersonaManagementList } from '../ui/render.js'; // Path changes to ../ui/ // Need to re-render the management list
import { announce } from '../js/domElements.js'; // Use announce from domElements.js as provided

import { filterAndRenderPersonas } from './filtering.js'; // Path remains ./ (within logic/) // Need to re-render the main persona grid
import { goBackToPersonas } from '../ui/viewManager.js'; // Path changes to ../ui/ // Might need to navigate after deleting active persona


// Helper to generate a simple unique key (timestamp + random)
const generatePersonaKey = (name) => {
    // Simple slug: lowercase, replace spaces with dash, remove non-alphanumeric/dash, truncate
    const nameSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 20);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    // Ensure key starts with a letter if name slug is empty or starts with dash/number
     const prefix = nameSlug || 'persona';
    // Add a fallback if the name results in an empty string
     const safePrefix = prefix.replace(/^[^a-z]+/, ''); // Ensure it starts with a letter
     const finalPrefix = safePrefix || 'persona'; // Fallback if slug is empty or starts with non-letter after filtering

    return `${finalPrefix}-${timestamp}-${random}`;
};


// Add or Update a persona
export const savePersona = (formData) => {
    const { key, name, instruction, types, categories } = formData;

    // Basic validation
    if (!name || name.trim() === '' || !instruction || instruction.trim() === '') {
        announce('Name and Instruction are required.');
        return false; // Indicate failure
    }

    const typesArray = types ? types.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
    const categoriesArray = categories ? categories.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];

    let isNew = false;
    let personaIndex = -1;
    if (key && key !== '') { // Check if key is not empty string
        personaIndex = appState.allPersonasMutable.findIndex(p => p.key === key);
    }

    if (personaIndex > -1) {
        // Update existing persona
        // Create a new object to avoid potential mutation issues elsewhere
        appState.allPersonasMutable[personaIndex] = {
            key: key, // Keep original key
            name: name.trim(), // Save trimmed name/instruction
            instruction: instruction.trim(),
            types: typesArray,
            categories: categoriesArray
        };
        console.log('Persona updated:', name);
        announce(`Persona "${name.trim()}" updated.`);
    } else {
        // Add new persona
        isNew = true;
        const newPersona = {
            key: generatePersonaKey(name.trim()), // Generate unique key based on trimmed name
            name: name.trim(),
            instruction: instruction.trim(),
            types: typesArray,
            categories: categoriesArray
        };
        appState.allPersonasMutable.push(newPersona);
        console.log('Persona added:', name);
        announce(`Persona "${name.trim()}" added.`);
    }

    savePersonas(); // Save the updated list to localStorage
    renderPersonaManagementList(appState.allPersonasMutable); // Re-render the management list
    filterAndRenderPersonas(); // Re-render the main persona grid

    return true; // Indicate success
};

// Delete a persona
export const deletePersona = (key) => {
    if (!key || key.trim() === '') { // Add check for empty key
        console.error("No valid key provided for deletion.");
        announce("Error: Could not delete persona.");
        return;
    }

    // Find the persona to announce its name
    const personaToDelete = appState.allPersonasMutable.find(p => p.key === key);
    const personaName = personaToDelete ? personaToDelete.name : 'Unknown';

    // Filter out the persona to delete
    const initialCount = appState.allPersonasMutable.length;
    appState.allPersonasMutable = appState.allPersonasMutable.filter(persona => persona.key !== key);
    const newCount = appState.allPersonasMutable.length;

    if (newCount < initialCount) {
        console.log('Persona deleted:', key);
        announce(`Persona "${personaName}" deleted.`);

        savePersonas(); // Save the updated list

        // If the deleted persona was the active chat persona, clear the chat state and go back
        if (appState.selectedPersona && appState.selectedPersona.key === key) {
             console.log(`Deleted active persona "${personaName}". Clearing chat state and going back.`);
             // goBackToPersonas handles saving the (now empty) chat state and navigating
             goBackToPersonas(); // This also triggers a re-render of the main grid
        } else {
            renderPersonaManagementList(appState.allPersonasMutable); // Re-render the management list
            filterAndRenderPersonas(); // Re-render the main persona grid
        }
    } else {
        console.warn('Persona not found for deletion:', key);
        announce(`Persona "${personaName}" not found.`);
    }
};

// Get a persona by key (used for editing)
export const getPersonaByKey = (key) => {
     if (!key || key.trim() === '') { // Add check for empty key
          console.error("No valid key provided for lookup.");
          return undefined;
     }
    return appState.allPersonasMutable.find(persona => persona.key === key);
};