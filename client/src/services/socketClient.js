import { io } from 'socket.io-client';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:10000';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_ORIGIN, {
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socket;
}
