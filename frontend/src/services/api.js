import axios from 'axios'
import { getApiBaseUrl } from './runtimeConfig'

const api = axios.create({
  baseURL: getApiBaseUrl(),
})

// Attach JWT to every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('hangman_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
