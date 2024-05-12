const express = require('express');
const app = express();
require('dotenv').config();
var cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./Config/dbConnection.js');
const PORT = process.env.PORT || 3500;
const cookieParser = require('cookie-parser');
const rateLimitMiddleware = require('./middleware/RateLimiter.js');
const tooBusy = require('toobusy-js');
const helmet = require('helmet');
const buildLogger = require('./Logger/ProdLogger.js');
const { getUnitCode } = require('./utils/logic.js');
const logger = buildLogger();

connectDB();

app.set("trust proxy", 1);
app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true, allowedHeaders: 'Content-Type' })); //allowedHeaders: ['Content-Type', 'Authorization', 'authorization']
app.use(express.urlencoded({ extended: false })); 
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(rateLimitMiddleware);
app.use(helmet());
app.use(function (req, res, next) {
    if(tooBusy()){
        return res.status(503).send("The server is too busy, please try again after a moment");
    } else {
        next();
    }
});
app.disable('x-powered-by');


// handle routers
app.use("/user", require("./Routers/UserRouter.js"));
app.use("/property", require("./Routers/ProperityRouter.js"));
app.use("/report", require("./Routers/ReportRouter.js"));
app.use("/admin", require("./Routers/AdminRouter.js"));


// Handle express errors
app.use((err, req, res, next) => {
    res.status(500).json({ message: 'server error' });
});


//handle errors & exceptions, with logger
process.on("uncaughtException", (err) => {

    console.error('uncaughtException error occured: ', err.message);

    async function waitForLogger(trans) {
        const transportsFinished = trans.transports.map(t => new Promise(resolve => t.on('finish', resolve)));
        trans.end();
        return Promise.all(transportsFinished);
    };

    logger.error(err);

    waitForLogger(logger).then(async() => {
        console.log('check the Log/exceptions.log file for error details');
        await mongoose.connection.close(true);
        process.exit(0);
    });

});


// Connect to mongoDB and Run the server on PORT
mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log("Server running on port:", PORT);
    });
});