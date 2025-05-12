import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error state management
 * 
 * @param {Function} apiFunction - The API function to call
 * @returns {Object} - Object containing loading, error, data, and execute function
 */
export const useApi = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Execute the API call with provided parameters
   * 
   * @param {...any} args - Arguments to pass to the API function
   * @returns {Promise} - Promise that resolves to the API response
   */
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (error) {
      setError(error.message || 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { loading, error, data, execute };
};

export default useApi; 