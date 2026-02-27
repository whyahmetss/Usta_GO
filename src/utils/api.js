import { API_URL, STORAGE_KEYS, REQUEST_TIMEOUT } from '../config';

// Get token from storage
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

// Set token to storage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
};

// Remove token from storage
export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

// Get user from storage
export const getStoredUser = () => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

// Set user to storage
export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

// Remove user from storage
export const removeStoredUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Fetch wrapper with error handling
export const fetchAPI = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    includeAuth = true,
  } = options;

  try {
    const token = getToken();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (includeAuth && token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
      method,
      headers: defaultHeaders,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await Promise.race([
      fetch(`${API_URL}${endpoint}`, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
      ),
    ]);

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        removeToken();
        removeStoredUser();
        window.location.href = '/auth';
      }

      throw new Error(data.message || data.error || 'API Error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Upload file helper
export const uploadFile = async (endpoint, file, fieldName = 'photo') => {
  try {
    const formData = new FormData();
    formData.append(fieldName, file);

    const token = getToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        removeStoredUser();
        window.location.href = '/auth';
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// Upload multiple files
export const uploadFiles = async (endpoint, files, fieldName = 'photos') => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    const token = getToken();
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        removeStoredUser();
        window.location.href = '/auth';
      }
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// Helper function to build query string
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });

  return searchParams.toString();
};
