const express = require("express")
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

// basic security headers
app.use(helmet())

// simple request logger for development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev'))

// rate limiter (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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
const emailRoutes = require('./routes/emailRoutes.js')
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
app.use("/api/emails", emailRoutes)

// catch 404s and forward
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

module.exports = app