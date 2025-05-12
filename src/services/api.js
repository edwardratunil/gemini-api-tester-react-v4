// API service for interacting with the backend

// Ensure API_URL ends with /api and has no double slashes
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api')
  .replace(/\/+$/, '')  // Remove trailing slashes
  .replace(/\/api$/, '') + '/api';  // Ensure /api at the end

console.log('API URL configured as:', API_URL);  // Debug log

/**
 * User Authentication APIs
 */

// Register a new user
export const register = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login a user
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * User Settings and Stats APIs
 */

// Update user score
export const updateUserScore = async (userId, stats) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/score`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stats),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
};

// Get leaderboard
export const getLeaderboard = async () => {
  try {
    const response = await fetch(`${API_URL}/leaderboard`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Save user settings
export const saveUserSettings = async (userId, settings) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
};

/**
 * Achievements APIs
 */

// Get user achievements
export const getUserAchievements = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/achievements`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

// Award achievement to user
export const awardAchievement = async (userId, achievementId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/achievements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ achievementId }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error awarding achievement:', error);
    throw error;
  }
};

/**
 * Words APIs
 */

// Save a used word
export const saveWord = async (word, hint, userId) => {
  try {
    const endpoint = userId 
      ? `/users/${userId}/words` 
      : '/words';
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word, hint }),
    });

    if (!response.ok) {
      throw new Error('Failed to save word');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving word:', error);
    throw error;
  }
};

// Get used words for a specific user
export const getUsedWords = async (userId = null) => {
  try {
    // If userId is provided, get words for that specific user
    // Otherwise, fall back to getting all words (for backward compatibility)
    const endpoint = userId ? `${API_URL}/users/${userId}/words/history` : `${API_URL}/words`;
    
    try {
      const response = await fetch(endpoint);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching used words:', error);
      // If endpoint is not found, return empty array instead of throwing error
      console.log('Endpoint not available, returning empty words array');
      return [];
    }
  } catch (error) {
    console.error('Error fetching used words:', error);
    // Return empty array as fallback
    return [];
  }
};

// Record word play for a user
export const recordWordPlay = async (userId, wordId, guessedCorrectly) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wordId, guessedCorrectly }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error recording word play:', error);
    throw error;
  }
};

// Clear word history
export const clearWordHistory = async () => {
  try {
    const response = await fetch(`${API_URL}/words`, {
      method: 'DELETE',
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error clearing word history:', error);
    throw error;
  }
};

/**
 * Question History APIs
 */

// Save a user question
export const saveUserQuestion = async (userId, question, response) => {
  try {
    const apiResponse = await fetch(`${API_URL}/users/${userId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question, 
        response,
        timestamp: new Date().toISOString() 
      }),
    });
    
    return await handleResponse(apiResponse);
  } catch (error) {
    console.error('Error saving question:', error);
    throw error;
  }
};

// Get questions history for a user
export const getUserQuestions = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/questions`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching question history:', error);
    // Return empty array as fallback
    return [];
  }
};

// Clear question history for a user
export const clearQuestionHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/questions`, {
      method: 'DELETE',
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error clearing question history:', error);
    throw error;
  }
};

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
};

// Add API health check
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Add comprehensive API test
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', API_URL);
    
    // Test 1: Health Check
    console.log('Test 1: Health Check');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health Check Response:', healthData);
    
    // Test 2: CORS Test
    console.log('Test 2: CORS Test');
    const corsResponse = await fetch(`${API_URL}/cors-test`);
    const corsData = await corsResponse.json();
    console.log('CORS Test Response:', corsData);
    
    // Test 3: Ping Test
    console.log('Test 3: Ping Test');
    const pingResponse = await fetch(`${API_URL}/ping`);
    const pingData = await pingResponse.json();
    console.log('Ping Test Response:', pingData);
    
    return {
      success: true,
      health: healthData,
      cors: corsData,
      ping: pingData
    };
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  register,
  login,
  getUserProfile,
  updateUserScore,
  getLeaderboard,
  saveUserSettings,
  getUserAchievements,
  awardAchievement,
  saveWord,
  getUsedWords,
  recordWordPlay,
  clearWordHistory,
  saveUserQuestion,
  getUserQuestions,
  clearQuestionHistory,
  checkApiHealth,
  testApiConnection
}; 