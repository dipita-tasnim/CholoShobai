require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const rideRoutes = require('./routes/rides');
const ratingRoutes = require('./routes/ratings');
const app = require('./app');
const { initializeSocket } = require('./socket');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

//routes
app.use('/api/rides', rideRoutes);
app.use('/api/ratings', ratingRoutes);

//connect to db
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    //listen for requests
    server.listen(process.env.PORT, () => {
        console.log('connected to db & listening on port', process.env.PORT)
    })
})
.catch((error) => {
    console.log(error)
})


