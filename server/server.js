require("dotenv").config()

const app = require("./src/app")
const port = process.env.PORT || 3000
const http = require('http')
const { Server } = require('socket.io')

const connect = require("./src/config/connect")
connect()

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite dev server
        methods: ["GET", "POST"]
    }
})

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join user-specific room for notifications
    socket.on('join', (userId) => {
        socket.join(userId)
        console.log(`User ${userId} joined room`)
    })

    // Handle real-time events
    socket.on('deal-updated', (data) => {
        // Broadcast to all users except sender
        socket.broadcast.emit('deal-updated', data)
    })

    socket.on('task-assigned', (data) => {
        // Send to specific user
        io.to(data.assignedTo).emit('task-assigned', data)
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

// Make io available to routes
app.set('io', io)

server.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})

// handle uncaught exceptions & unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // optionally close server & exit
  server.close(() => process.exit(1));
});