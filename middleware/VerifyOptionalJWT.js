const jwt = require('jsonwebtoken');
const { checkWhiteListAccessToken } = require('../utils/logic.js');
const asyncHandler = require('express-async-handler');

const verifyJWTOptional = asyncHandler( async (req, res, next) => {

    const token = req?.cookies?._a_t;

    if(!token) return next();

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        asyncHandler( async (err, decoded) => {

            if(!err && decoded) {
                req.user = decoded.user;
            }

            next();
            
        })
    );
});

module.exports = verifyJWTOptional;