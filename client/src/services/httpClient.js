import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Optionally handle global 401s here by forcing a logout event
    return Promise.reject(error.response?.data?.error || error);
  }
);
