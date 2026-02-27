import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config'

let socket = null

export const connectSocket = (userId) => {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    if (userId) {
      socket.emit('join_room', userId)
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
