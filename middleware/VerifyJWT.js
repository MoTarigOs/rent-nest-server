const jwt = require('jsonwebtoken');
const { checkWhiteListAccessToken } = require('../utils/logic.js');
const asyncHandler = require('express-async-handler');

const verifyJWT = asyncHandler( async (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization;

    let token;

    console.log('authHeader', authHeader);

    if (req.cookies?._a_t) {
        // Web Flow: Extract from Cookie
        token = req.cookies._a_t;
    } else if (authHeader?.startsWith('Bearer ')) {
        // Mobile Flow: Extract from "Bearer <token>"
        token = authHeader.split(' ')[1];
    } else {
    console.log('returned early');

        return res.status(401).json({ message: "jwt expired" });
    }

    // if(!req?.cookies || !req?.cookies?._r_t)
    //     return res.status(401).json({ message: "Login" });

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        asyncHandler( async (err, decoded) => {

            console.log('the token: ', token, ' err: ', err);

            if(err)
                return res.status(401).json({ message: "jwt expired" }); //forbidden due to invalid token

            req.user = decoded.user;

            req.token_exp = (decoded.exp * 1000) - (decoded.iat * 1000);

            if(req?.user?.email)
                req.user.email = req.user.email.toLowerCase();

            const userEmail = req.user.email;
            const allowed = await checkWhiteListAccessToken(userEmail, token);

            console.log('reached allowed');

            if(!allowed || allowed === false)
                return res.status(401).json({ message: "jwt expired" });

            next();
            
        })
    );
});

module.exports = verifyJWT;