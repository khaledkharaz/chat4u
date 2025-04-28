// --- API Call Logic ---
// Function to send message to AI API (Direct client-side call - INSECURE!)

import { GOOGLE_API_KEY, API_BASE_URL, NEGATIVE_INSTRUCTION } from '../../../js/config.js'; // Path changes to ../../../js/

export const sendMessageToAPI = async (personaInstruction, history, message) => {
    const finalSystemInstruction = `${personaInstruction} ${NEGATIVE_INSTRUCTION}`;

    // Gemini expects history in a specific format
    // The API call logic will add the *current* user message to the history we pass.
    const contents = history.map(msg => ({
        role: msg.role,
        parts: msg.parts
    }));
     // Add the current user message *for this API call*
     // Note: The calling code (logic/chat/core.js) is responsible for adding the user message to the *application's* history state *before* calling this.
     contents.push({ role: 'user', parts: [{ text: message }] });


     // Check API key is configured *before* fetch
     if (GOOGLE_API_KEY === '' || GOOGLE_API_KEY.length < 20 || GOOGLE_API_KEY.startsWith('YOUR')) {
         console.error("API Key is not configured correctly. Cannot send message.");
          throw new Error("API Key Error: Chat functionality is not properly configured.");
     }


    const apiRequestBody = {
        contents: contents,
        systemInstruction: {
            parts: [{ text: finalSystemInstruction }]
        },
         // Optional: Add generation config for tuning
         generationConfig: {
             temperature: 0.7, // Example: Adjust for creativity (0.0 - 1.0)
             topP: 0.95, // Example: Adjust for diversity
             topK: 40 // Example: Adjust for diversity
         }
    };

    // THIS IS THE DIRECT API CALL (Insecure client-side)
    const apiResponse = await fetch(`${API_BASE_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
    });

    if (!apiResponse.ok) {
         const errorBody = await apiResponse.json().catch(() => ({ error: { message: 'Unknown API Error' } }));
         const errorMessage = errorBody.error?.message || apiResponse.statusText;
        console.error(`API Error: ${apiResponse.status} - ${errorMessage}`, errorBody);
         throw new Error(`API Error: ${apiResponse.status} - ${errorMessage}`);
    }

    const apiData = await apiResponse.json();
    return apiData; // Return the raw API response data
};