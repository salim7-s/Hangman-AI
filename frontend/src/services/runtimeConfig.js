function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  // Explicit env var always wins (set this in production)
  const configuredUrl = import.meta.env.VITE_API_URL
  if (configuredUrl) return trimTrailingSlash(configuredUrl)

  // SSR guard
  if (typeof window === 'undefined') return 'http://localhost:5000'

  const { protocol, hostname, port } = window.location

  // In production (no explicit env var), assume backend is on the same origin
  // This works for Railway deployments where frontend and backend are co-hosted,
  // or when a reverse proxy routes /api/* to the backend.
  if (import.meta.env.PROD) {
    return `${protocol}//${hostname}${port ? ':' + port : ''}`
  }

  // Dev: default to localhost:5000
  return 'http://localhost:5000'
}
