require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const rideRoutes = require('./routes/rides');
const ratingRoutes = require('./routes/ratings');
const app = require('./app');

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
    app.listen(process.env.PORT, () => {
        console.log('connected to db & listening on port', process.env.PORT)
    })
})
.catch((error) => {
    console.log(error)
})


