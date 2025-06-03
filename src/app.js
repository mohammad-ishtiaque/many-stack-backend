const express = require('express');
const connectDB = require('./config/db');
const app = express();
const authRoutes = require('./routes/auth.router'); 
const userRoutes = require('./routes/user.router');
const categoryRoutes = require('./routes/category.router');
const supportRoutes = require('./routes/support.router');
const interventionRoutes = require('./routes/intervention.router');
const invoiceRoutes = require('./routes/invoice.router');
// const rvRoutes = require('./routes/rv.routes');
// const membershipRoutes = require('./routes/membership.routes')
// const insuranceRoutes = require('./routes/insurance.routes');
// const maintenanceRoutes = require('./routes/maintenance.routes');
// const repairRoutes = require('./routes/repair.routes');
const dotenv = require('dotenv');
// const path = require('path');
// const newExpenseRoutes = require('./routes/newExpense.routes');
// const tripsRoutes = require('./routes/trips.routes');
// const chassisRoutes = require('./routes/chessis.routes');
// const tireRoutes = require('./routes/appliance.routes/tire.routes');

dotenv.config();

// DB Connection
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const os = require('os');

// const totalCpus = os.cpus().length;
// console.log(`Total CPUs: ${totalCpus}`);

// // Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/intervention', interventionRoutes);
app.use('/api/invoices', invoiceRoutes);
// app.use('/api/rv', rvRoutes);
// app.use('/api/membership', membershipRoutes);
// app.use('/api/insurance', insuranceRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/repair', repairRoutes);
// app.use('/api/expenses', newExpenseRoutes);
// app.use('/api/trips', tripsRoutes);
// app.use('/api/chassis', chassisRoutes);
// app.use('/api/appliance/tire', tireRoutes);
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


module.exports = app;
