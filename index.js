require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database'); // Adjust the path if necessary

const app = express();
const leaderboardRoutes = require('./routes/leaderboard'); // Adjust the path if necessary

// Middleware
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));
app.use(express.json());

// Routes
app.use('/api', leaderboardRoutes);

// Sync the model with the database
sequelize.sync({ force: true }) // `force: true` will drop the table if it exists and recreate it
  .then(() => {
    console.log('Database & table created!');
  })
  .catch(error => {
    console.error('Error creating table:', error);
  });

// Basic route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
