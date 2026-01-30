const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000' : 'https://chat-app-6-y7uf.onrender.com');
