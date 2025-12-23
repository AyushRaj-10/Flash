import { io } from 'socket.io-client';

class SocketIOClient {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
    this.reconnectDelay = 1000;
    this.connected = false;
  }

  connect() {
    // In development, use proxy via window.location, otherwise use env var or default
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.DEV ? window.location.origin : 'http://localhost:3000');
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.emit('error', error);
    });

    // Listen for queueUpdated events from backend
    this.socket.on('queueUpdated', (data) => {
      this.emit('QUEUE_UPDATED', data);
    });

    // Listen for seatedUpdated events from backend
    this.socket.on('seatedUpdated', (data) => {
      this.emit('SEATED_UPDATED', data);
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // If socket is connected and this is a socket event, also register with socket
    if (this.socket && this.socket.connected) {
      if (event !== 'connected' && event !== 'disconnected' && event !== 'error') {
        // For custom events, we handle them through our emit system
        // Backend events like 'queueUpdated' are already handled in connect()
      }
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export default new SocketIOClient();
