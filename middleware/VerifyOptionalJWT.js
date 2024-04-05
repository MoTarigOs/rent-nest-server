const jwt = require('jsonwebtoken');
const { checkWhiteListAccessToken } = require('../utils/logic.js');
const asyncHandler = require('express-async-handler');

const verifyJWTOptional = asyncHandler( async (req, res, next) => {

    const token = req?.cookies?._a_t;

    if(!token) next();

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        asyncHandler( async (err, decoded) => {

            if(err) next();

            req.user = decoded.user;

            next();
            
        })
    );
});

module.exports = verifyJWTOptional;