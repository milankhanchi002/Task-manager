import axios from 'axios';

// Get API base URL from environment or use localhost for development
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the Railway backend URL
    return import.meta.env.VITE_API_URL || '/api/v1';
  }
  return 'http://localhost:5001/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true // send cookies
});

export default api;
