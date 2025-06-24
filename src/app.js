const express = require('express');
const connectDB = require('./config/db');
const app = express();
const authRoutes = require('./routes/auth.router'); 
const userRoutes = require('./routes/user.router');
const categoryRoutes = require('./routes/category.router');
const supportRoutes = require('./routes/support.router');
const interventionRoutes = require('./routes/intervention.router');
const invoiceRoutes = require('./routes/invoice.router');
const expenseRoutes = require('./routes/expenses.router');
const subscriptionRoutes = require('./routes/Dashboard/subscription.router');
const allcategoryRoutes = require('./routes/Dashboard/allcategory.router');
const settingsRoutes = require('./routes/Dashboard/settings.router');
const makeAdminRoutes = require('./routes/Dashboard/makeAdmin.router');
const userManagementRoutes = require('./routes/Dashboard/usermanagement.router');
const homePageRoutes = require('./routes/homePage.router');
const path = require('path');
// const rvRoutes = require('./routes/rv.routes');
// const membershipRoutes = require('./routes/membership.routes')
// const insuranceRoutes = require('./routes/insurance.routes');
// const maintenanceRoutes = require('./routes/maintenance.routes');
// const repairRoutes = require('./routes/repair.routes');
const dotenv = require('dotenv');
const cors = require('cors');
// const path = require('path');
// const newExpenseRoutes = require('./routes/newExpense.routes');
// const tripsRoutes = require('./routes/trips.routes');
// const chassisRoutes = require('./routes/chessis.routes');
// const tireRoutes = require('./routes/appliance.routes/tire.routes');

dotenv.config();

// DB Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const os = require('os');

// const totalCpus = os.cpus().length;
// console.log(`Total CPUs: ${totalCpus}`);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// // Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/intervention', interventionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/dashboard/subscription', subscriptionRoutes);
app.use('/api/dashboard/allcategory', allcategoryRoutes);
app.use('/api/dashboard/settings', settingsRoutes);
app.use('/api/dashboard', makeAdminRoutes);
app.use('/api/dashboard', userManagementRoutes);
app.use('/api/home', homePageRoutes);
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
