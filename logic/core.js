// --- Core Chat Logic ---
// Handles sending messages, processing responses, and updating chat state/UI.

 import { appState } from '../../../js/state.js'; // Path changes to ../../../js/
import { userInput, sendButton, chatbox, body } from '../../../js/domElements.js'; // Path changes to ../../../js/, import body
import { displayUserMessage, displayBotMessage, scrollToBottom } from '../../../js/render.js'; // Path changes to ../../../ui/, announce is in domElements
import { announce } from '../../../js/domElements.js'; // Use announce from domElements.js as provided


import { sendMessageToAPI } from './api.js'; // Path remains ./ (within chat/)
import { saveActiveChatState } from '../../../js/persistence.js'; // Path changes to ../../../js/
import { GOOGLE_API_KEY } from '../../../js/config.js'; // Path changes to ../../../js/


export const sendMessage = async () => {
    const messageText = userInput.value.trim();

    // Basic validation
    // Check appState.isLocked and current state as well as input disabled
    if (appState.isLocked || appState.currentState !== 'chat' || !messageText || !appState.selectedPersona || (userInput && userInput.disabled)) { // Add defensive check for userInput
        console.warn("Attempted to send message when not allowed.");
        return;
    }

    // Disable input while waiting for response
    if (userInput) userInput.disabled = true;
    if (sendButton) sendButton.disabled = true;

    // Display user message immediately
    displayUserMessage(messageText);
    if (userInput) userInput.value = '';
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

        const apiData = await sendMessageToAPI(appState.selectedPersona.instruction, appState.conversationHistory, messageText);


        // Remove typing indicator
        if (typingIndicator && chatbox && typingIndicator.parentElement) {
            chatbox.removeChild(typingIndicator);
        }

        let botResponseText = '';

        // Process API response data
        if (apiData.candidates && apiData.candidates[0]) {
            if (apiData.candidates[0].finishReason === 'SAFETY') {
                 console.warn('API response blocked due to safety settings:', apiData.candidates[0].safetyRatings);
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                     appState.conversationHistory.pop();
                 }
                 saveActiveChatState();

                 botResponseText = "I'm sorry, but I cannot respond to that message due to safety guidelines. Please try rephrasing.";
                 displayBotMessage(botResponseText, false);
                 announce("AI response blocked due to safety guidelines.");
            } else if (apiData.candidates[0].content && apiData.candidates[0].content.parts && apiData.candidates[0].content.parts[0] && apiData.candidates[0].content.parts[0].text) {
                botResponseText = apiData.candidates[0].content.parts[0].text;
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                    appState.conversationHistory.push({ role: 'model', parts: [{ text: botResponseText }] });
                    displayBotMessage(botResponseText, false);
                    announce(`AI response: ${botResponseText.substring(0, Math.min(botResponseText.length, 100))}...`);
                    saveActiveChatState();

                 } else {
                     console.error("History state mismatch: Expected last message to be user before adding model response.");
                      displayBotMessage('An internal error occurred processing the response.', false);
                      announce('An internal error occurred processing the response.');
                 }

            } else {
                 console.warn('API response received, but no text content found:', apiData);
                 if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                     appState.conversationHistory.pop();
                 }
                 saveActiveChatState();

                 botResponseText = 'Received an invalid or empty response from the AI.';
                 displayBotMessage(botResponseText, false);
                 announce('Received an invalid or empty response from the AI.');
            }
        } else {
             console.error('Unexpected API response structure or empty candidates:', apiData);
             if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
                 appState.conversationHistory.pop();
             }
             saveActiveChatState();

             botResponseText = 'Error: Could not get a valid response from the AI.';
             displayBotMessage(botResponseText, false);
             announce('Error: Could not get an valid response from the AI.');
        }

        scrollToBottom();


    } catch (error) {
        console.error('Error during chat message processing:', error);
         if (typingIndicator && chatbox && typingIndicator.parentElement) {
             chatbox.removeChild(typingIndicator);
         }

         if(appState.conversationHistory.length > 0 && appState.conversationHistory[appState.conversationHistory.length - 1].role === 'user') {
             appState.conversationHistory.pop();
         }
         saveActiveChatState();


        displayBotMessage(`Error: ${error.message || 'Failed to get AI response.'}`, false);
         scrollToBottom();
         announce(`Error: ${error.message || 'Failed to get AI response.'}`);

    } finally {
          const isApiKeyValid = GOOGLE_API_KEY !== '' && GOOGLE_API_KEY.length >= 20 && !GOOGLE_API_KEY.startsWith('YOUR');
          if (!appState.isLocked && appState.currentState === 'chat' && isApiKeyValid) {
              if (userInput) userInput.disabled = false;
              if (sendButton) sendButton.disabled = false;
              if (userInput) userInput.focus();
          } else if (!appState.isLocked && appState.currentState === 'chat') {
              console.warn("Chat input remains disabled after API call due to missing/invalid API key.");
          }
    }
};