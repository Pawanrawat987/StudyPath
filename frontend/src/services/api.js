import axios from 'axios';

// Shared Axios instance for all backend requests
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

export default api;
