import { useRef, useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { getApiBaseUrl } from '../services/runtimeConfig'

let socketInstance = null

function getSocket() {
  if (!socketInstance || socketInstance.disconnected) {
    socketInstance = io(getApiBaseUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function useSocket() {
  const socketRef = useRef(null)

  useEffect(() => {
    socketRef.current = getSocket()
    return () => {
      // Do NOT disconnect on unmount — shared singleton keeps connection alive
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
