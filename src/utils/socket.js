import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config'

let socket = null
let currentUserId = null

export const connectSocket = (userId) => {
  currentUserId = userId

  if (socket?.connected) {
    // Already connected, just re-join room
    socket.emit('join_room', userId)
    return socket
  }

  // Disconnect old socket if exists but not connected
  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    if (currentUserId) {
      socket.emit('join_room', currentUserId)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export const emitEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data)
  }
}
