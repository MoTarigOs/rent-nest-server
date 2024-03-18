const express = require('express');
const app = express();
require('dotenv').config();
var cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./Config/dbConnection');
const PORT = process.env.PORT;
const cookieParser = require('cookie-parser');

connectDB();


app.use(cors({ origin: 'http://localhost:3000', credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'authorization'] }));
app.use(express.urlencoded({ extended: false })); 
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());


// handle routers
app.use("/user", require("./Routers/UserRouter"));
app.use("/property", require("./Routers/ProperityRouter"));
// app.use("/admin", require("./Routers/AdminRouter"));


//handle errors & exceptions, with logger
process.on("uncaughtException", (err) => {

    console.log('uncaughtexception error');

    // const errMsg = err.stack.toString().replaceAll(/[\n\r]/g, '');

    // logger.error(errMsg, () => {
    //     mongoose.disconnect();
    //     process.exit(0);
    // });

});


// Connect to mongoDB and Run the server on PORT
mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    });
});