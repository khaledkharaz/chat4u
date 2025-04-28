// --- Core Chat Logic ---
// Handles sending messages, processing responses, and updating chat state/UI.

 import { appState } from '../../js/state.js'
import { userInput, sendButton, chatbox, body } from '../../js/domElements.js'; // Import body for locked check
import { displayUserMessage, displayBotMessage, scrollToBottom, announce } from '../../ui/render.js';
import { sendMessageToAPI } from './api.js'; // Import the API call function
import { saveActiveChatState } from '../../js/persistence.js'; // Need to save state
import { GOOGLE_API_KEY } from '../../js/config.js'; // <<< CORRECTED: Static import GOOGLE_API_KEY


export const sendMessage = async () => {
    const messageText = userInput.value.trim();

    // Basic validation
    // Check userInput.disabled as it's updated based on API key status or busy state
    if (!messageText || !appState.selectedPersona || userInput.disabled) {
        return;
    }

    // Disable input while waiting for response
    userInput.disabled = true;
    sendButton.disabled = true;

    // Display user message immediately
    displayUserMessage(messageText);
    userInput.value = ''; // Clear input field
    scrollToBottom();

    // Add user message to history immediately
    appState.conversationHistory.push({ role: 'user', parts: [{ text: messageText }] });

    // --- Save state (including history) after user sends message ---
    saveActiveChatState();


    let typingIndicator = null;
    try {
        // Display typing indicator
        typingIndicator = displayBotMessage("...", true);
        scrollToBottom();

        // Call the API function, passing the *entire* current history and the new message text
        // The API function expects the history *up to the last model response* + the new user message.
        // Our `appState.conversationHistory` now contains the new user message, which matches the API's expectation
        // when the user is the last speaker in the history sent to the API.
        const apiData = await sendMessageToAPI(appState.selectedPersona.instruction, appState.conversationHistory, messageText);


        // Remove typing indicator
        if (typingIndicator && typingIndicator.parentElement) {
            chatbox.removeChild(typingIndicator); // Changed from typingIndicator.parentElement.removeChild to chatbox.removeChild
        }

        let botResponseText = '';

        // Process API response data
        if (apiData.candidates && apiData.candidates[0]) {
            if (apiData.candidates[0].finishReason === 'SAFETY') {
                 console.warn('API response blocked due to safety settings:', apiData.candidates[0].safetyRatings);
                 // If blocked, remove the user's *last* message from history,
                 // because the AI didn't respond *to it* in character.
                 // We already added it to history *before* calling the API, so pop it.
                 // Verify it's the user's message before popping, just in case.
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                     appState.conversationHistory.pop();
                 }
                 // --- Save state after potentially removing user message ---
                 saveActiveChatState();

                 botResponseText = "I'm sorry, but I cannot respond to that message due to safety guidelines. Please try rephrasing.";
                 displayBotMessage(botResponseText, false); // Display the safety message
                 announce("AI response blocked due to safety guidelines."); // Announce for screen readers
            } else if (apiData.candidates[0].content && apiData.candidates[0].content.parts && apiData.candidates[0].content.parts[0] && apiData.candidates[0].content.parts[0].text) {
                botResponseText = apiData.candidates[0].content.parts[0].text;
                // Add the valid bot response to history
                 // Check if the last message is already user (it should be) before pushing model
                 // This check is important if API call fails *after* we pushed user message but *before* we get a response.
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                    appState.conversationHistory.push({ role: 'model', parts: [{ text: botResponseText }] });
                    displayBotMessage(botResponseText, false); // Display the bot's response
                    // Announce the first part of the bot message, or maybe the whole thing if short
                    announce(`AI response: ${botResponseText.substring(0, Math.min(botResponseText.length, 100))}...`); // Announce a bit more text
                    // --- Save state after adding bot response ---
                    saveActiveChatState();

                 } else {
                     console.error("History state mismatch: Expected last message to be user before adding model response.");
                      displayBotMessage('An internal error occurred processing the response.', false); // Display error to user
                      announce('An internal error occurred processing the response.'); // Announce error
                      // No need to save state here, it's an internal error, history is potentially inconsistent.
                 }

            } else {
                 console.warn('API response received, but no text content found:', apiData);
                 // If no valid content, remove the user's message from history
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                     appState.conversationHistory.pop(); // Remove user message because it wasn't replied to properly
                 }
                 // --- Save state after potentially removing user message ---
                 saveActiveChatState();

                 botResponseText = 'Received an invalid or empty response from the AI.';
                 displayBotMessage(botResponseText, false); // Display an error message
                 announce('Received an invalid or empty response from the AI.');
            }
        } else {
             console.error('Unexpected API response structure or empty candidates:', apiData);
             if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                 appState.conversationHistory.pop(); // Remove user message
             }
             // --- Save state after potentially removing user message ---
             saveActiveChatState();

             botResponseText = 'Error: Could not get a valid response from the AI.';
             displayBotMessage(botResponseText, false); // Display an error message
             announce('Error: Could not get a valid response from the AI.');
        }

        scrollToBottom(); // Scroll after new message


    } catch (error) {
        console.error('Error during chat message processing:', error);
         // Ensure typing indicator is removed on error
         if (typingIndicator && typingIndicator.parentElement) {
             chatbox.removeChild(typingIndicator); // Changed from typingIndicator.parentElement.removeChild to chatbox.removeChild
         }

         // If an error occurred during the API call or processing,
         // the user's last message wasn't responded to. Remove it from history.
         // Check if the last message was indeed the user's message just sent.
         if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
             appState.conversationHistory.pop();
         }
         // --- Save state after potentially removing user message ---
         saveActiveChatState();


        displayBotMessage(`Error: ${error.message || 'Failed to get AI response.'}`, false);
         scrollToBottom();
         announce(`Error: ${error.message || 'Failed to get AI response.'}`);

    } finally {
         // Always re-enable input and send button unless the API key check failed globally or app is locked
         // Check if unlocked AND API key is valid before re-enabling
         // Use the statically imported GOOGLE_API_KEY and the body element for locked check
          const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');
          if (!body.classList.contains('locked') && isApiKeyValid) {
              userInput.disabled = false;
              sendButton.disabled = false;
              // Keep focus only if user hasn't navigated away or focused something else and we are still in the chat view
              // Check appState.currentState directly as body class is only for locked state
              if (appState.currentState === 'chat') {
                  userInput.focus();
              }
          } else if (!body.classList.contains('locked')) {
              // If unlocked but API key is bad, input stays disabled.
              console.warn("Chat input remains disabled after API call due to missing/invalid API key.");
          }
    }
};