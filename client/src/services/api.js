// ─────────────────────────────────────────────────────────
// api.js — Axios HTTP Client Instance
// Creates a pre-configured Axios instance that all pages and
// components use to talk to the backend API.
//
// Key behaviours:
//  - Automatically uses the correct backend URL from .env
//  - Attaches the JWT token from localStorage to every request
//    so the server knows who is making the call
// ─────────────────────────────────────────────────────────

import axios from 'axios';

// Create an Axios instance with the API base URL
// VITE_API_URL is set in the client's .env file (e.g. http://localhost:5002/api)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
});

// Request interceptor — runs before every outgoing API call
// Reads the JWT token from localStorage and adds it to the Authorization header
// This means every API call is automatically authenticated
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Standard Bearer token format
  }
  return config; // Continue sending the request
});

export default api;
