import { api } from './api';

// Проверка на то, что мы в браузере
const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

export const checkAuth = () => {
  if (!isClient) return false;

  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  // Устанавливаем токен в axios defaults
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return true;
};

export const logout = () => {
  if (!isClient) return;

  localStorage.removeItem('token');
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  delete api.defaults.headers.common['Authorization'];
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  if (!isClient) return false;
  return !!localStorage.getItem('token');
};