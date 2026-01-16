// frontend/src/services/socketService.js
import { io } from 'socket.io-client'
import { store } from '../redux/store'
import { addNotification } from '../redux/notificationSlice'
import { fetchDeals } from '../redux/dealSlice'
import { fetchTasks } from '../redux/taskSlice'
import { fetchStages } from '../redux/stageSlice'
import { toast } from 'react-toastify'

class SocketService {
    constructor() {
        this.socket = null
        this.onNotificationCallback = null
    }

    setNotificationCallback(callback) {
        this.onNotificationCallback = callback
    }

    connect(userId) {
        if (this.socket?.connected) return

        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling']
        })

        this.socket.on('connect', () => {
            console.log('Connected to server')

            // Request browser notification permission on first connect
            this.requestNotificationPermission()

            // Join user room
            if (userId) {
                this.socket.emit('join', userId)
            }
        })

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server')
        })

        // Listen for real-time events
        this.socket.on('deal-updated', (data) => {
            console.log('Deal updated:', data)
            toast.info(`Deal "${data.title}" was updated`)
            // Refresh deals data
            store.dispatch(fetchDeals())
        })

        this.socket.on('task-assigned', (data) => {
            console.log('Task assigned:', data)
            toast.success(`New task assigned: "${data.title}"`)
            // Refresh tasks data
            store.dispatch(fetchTasks())
        })

        this.socket.on('stage-created', (data) => {
            console.log('Stage created:', data)
            toast.success(`New stage "${data.name}" has been added to the pipeline`)
            // Refresh stages data
            store.dispatch(fetchStages())
        })

        this.socket.on('stage-updated', (data) => {
            console.log('Stage updated:', data)
            toast.info(`Stage "${data.name}" has been updated`)
            // Refresh stages data
            store.dispatch(fetchStages())
        })

        this.socket.on('stage-deleted', (data) => {
            console.log('Stage deleted:', data)
            toast.warning(`Stage "${data.name}" has been deleted`)
            // Refresh stages data
            store.dispatch(fetchStages())
        })

        this.socket.on('notification-created', (data) => {
            console.log('Notification created for user:', data)
            // Add to Redux store
            store.dispatch(addNotification(data))
            // Removed toast notification - only persistent banners now

            // Show browser notification if permission granted
            this.showBrowserNotification(data)

            // Call callback for persistent notifications
            if (this.onNotificationCallback) {
                this.onNotificationCallback(data)
            }
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
        })
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect()
        }
    }

    // Emit events
    emitDealUpdated(data) {
        if (this.socket?.connected) {
            this.socket.emit('deal-updated', data)
        }
    }

    emitTaskAssigned(data) {
        if (this.socket?.connected) {
            this.socket.emit('task-assigned', data)
        }
    }

    showBrowserNotification(data) {
        // Check if browser notifications are supported
        if (!('Notification' in window)) {
            console.log('Browser notifications not supported')
            return
        }

        // Check permission
        if (Notification.permission === 'granted') {
            this.createBrowserNotification(data)
        } else if (Notification.permission !== 'denied') {
            // Request permission
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.createBrowserNotification(data)
                }
            })
        }
    }

    createBrowserNotification(data) {
        const notification = new Notification(data.title, {
            body: data.message,
            icon: '/vite.svg', // Use the existing vite icon
            badge: '/vite.svg',
            tag: `crm-notification-${data._id}`, // Prevents duplicate notifications
            requireInteraction: false, // Auto-close after a few seconds
            silent: false // Allow sound if user has it enabled
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close()
        }, 5000)

        // Handle click
        notification.onclick = () => {
            window.focus()
            notification.close()
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission)
            })
        }
    }

    emitNotificationCreated(data) {
        if (this.socket?.connected) {
            this.socket.emit('notification-created', data)
        }
    }

    // Check connection status
    get isConnected() {
        return this.socket?.connected || false
    }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService