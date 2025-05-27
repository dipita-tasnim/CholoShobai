const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... existing code ...
const messageRoutes = require('./routes/message.routes');
// ... existing code ...

// Add this line with other route declarations
app.use('/api/messages', messageRoutes);
// ... existing code ...


app.get("/", (req, res) => {
    res.send("Hellp  sidrat world");
});

app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

module.exports = app;