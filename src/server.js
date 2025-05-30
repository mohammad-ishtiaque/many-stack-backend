// src/server.js
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST_URL || '0.0.0.0';

app.listen(PORT,HOST, () => {
  console.log(`🚐Many Stack backend is running on port https://${HOST}:${PORT}`);
});


