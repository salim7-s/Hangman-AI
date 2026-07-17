import { useRef, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { getApiBaseUrl } from '../services/runtimeConfig'

let socketInstance = null
let lastToken = null

function getSocket(token = localStorage.getItem('hangman_token')) {
  if (socketInstance && token !== lastToken) {
    socketInstance.disconnect()
    socketInstance = null
  }
  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(getApiBaseUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    lastToken = token
  }

  return socketInstance
}

export function useSocket() {
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('hangman_token')

    if (socketInstance) {
      socketInstance.auth = { token }

      if (socketInstance.connected) {
        socketInstance.disconnect()
      }
    }

    socketRef.current = getSocket(token)

    if (!socketRef.current.connected) {
      socketRef.current.connect()
    }

    return () => {
      // Shared singleton keeps the connection alive across route changes.
    }
  }, [])

  const emit = useCallback((event, data) => {
    const s = socketRef.current || getSocket()
    s.emit(event, data)
  }, [])

  const on = useCallback((event, handler) => {
    const s = socketRef.current || getSocket()
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [])

  return { emit, on }
}
