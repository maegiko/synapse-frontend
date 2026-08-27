/**
 * The single place the backend location and every endpoint path is declared.
 * Point the app at another environment by setting VITE_API_BASE_URL; nothing
 * else in the codebase should ever hard-code a URL.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const API_PATHS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    password: '/api/auth/password',
  },
  user: {
    details: '/api/user/details',
  },
} as const
