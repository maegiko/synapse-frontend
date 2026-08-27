import * as auth from './auth'
import * as flashcards from './flashcards'
import * as notes from './notes'
import * as quiz from './quiz'
import * as user from './user'

/** Every backend call in the app goes through this object. */
export const api = { auth, user, notes, flashcards, quiz }

export { ApiError, NETWORK_ERROR_STATUS, refreshAccessToken } from './client'
export { API_BASE_URL, API_PATHS } from './config'
export { getAccessToken, setAccessToken, subscribeToAccessToken } from './tokenStore'
export type * from './types'
