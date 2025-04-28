// !!! IMPORTANT SECURITY WARNING !!!
// Placing your API key directly in frontend code is HIGHLY INSECURE.
// Anyone viewing your page source can steal your key, potentially leading to unexpected charges.
// Use this ONLY for local development or trusted environments.
// For production, ALWAYS use a backend server to handle API calls securely.
// As requested, this risk is acknowledged and this key remains client-side for now.
// ========================================================

// --- API Configuration ---
export const GOOGLE_API_KEY = 'AIzaSyDxyKzjSP-9AmafkH67mZIKPjrinhBWtN8'; // <--- REPLACE WITH YOUR ACTUAL KEY
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Negative instruction to prevent revealing AI identity (always apply)
export const NEGATIVE_INSTRUCTION = `Absolutely do NOT mention that you are an AI, a bot, a large language model, a machine, a computer program, artificial intelligence, or anything similar. Do not break character or refer to yourself as anything other than the persona you are roleplaying.`;

// --- Authentication Configuration ---
export const UNLOCK_PASSWORD = 'AZ11223300'; // Hardcoded password
export const UNLOCK_CLICK_THRESHOLD = 5; // Number of clicks to reveal password input

// --- Persistence Storage Keys ---
export const SESSION_STORAGE_KEY_UNLOCKED = 'appUnlocked'; // Key for session storage for unlock state
export const SESSION_STORAGE_KEY_ACTIVE_PERSONA = 'activePersonaKey'; // Key for active persona key in session storage
export const SESSION_STORAGE_KEY_HISTORY = 'conversationHistory'; // Key for conversation history in session storage
export const LOCAL_STORAGE_KEY_STATE = 'aiPersonaChatAppState'; // Key for localStorage for filters etc.
export const LOCAL_STORAGE_KEY_THEME = 'theme'; // Key for theme preference

// --- NEW: Persona Storage Key ---
export const LOCAL_STORAGE_KEY_PERSONAS = 'aiPersonaChatPersonas';
