const express = require('express');
const cors = require('cors');
require('dotenv').config();

const graphRoutes = require('./routes/graph');
//const routePaths = require('./routes/routes'); // <-- Add this line

const app = express();
app.use(cors());
app.use(express.json()); // <-- Add this if not already present

app.use('/api/graph', graphRoutes);
//app.use('/api/routes', routePaths); // <-- Add this line

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
