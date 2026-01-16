const express = require("express")
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
app.use(cookieParser()); 
app.use(cors({
    origin: "http://localhost:5173",
    credentials : true
}))
app.use(express.json())
app.use(express.urlencoded({extended : true}))

const authRoutes = require("./routes/authRoutes.js");

const leadRoutes = require("./routes/leadRoutes.js");
const noteRoutes = require("./routes/noteRoutes");
const customerRoutes = require("./routes/customerRoutes.js")
const dealsRoutes = require('./routes/dealRoutes.js');
const stageRoutes = require('./routes/stageRoutes');
const taskRoutes = require('./routes/taskRoutes.js')
const dashboardRoutes = require('./routes/dashboardRoute.js')
const logRoutes = require('./routes/logRoutes.js')
const userRoutes = require('./routes/userRoutes.js')
const reportRoutes = require('./routes/reportRoutes.js')
const emailTemplateRoutes = require('./routes/emailTemplateRoutes.js')
const notificationRoutes = require('./routes/notificationRoutes.js')
app.use("/api/leads", leadRoutes)
app.use("/api/notes", noteRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/task' , taskRoutes)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs' , logRoutes)
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes)
app.use("/api/email-templates", emailTemplateRoutes)
app.use("/api/notifications", notificationRoutes)

module.exports = app