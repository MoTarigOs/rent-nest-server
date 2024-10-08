const jwt = require('jsonwebtoken');
const { checkWhiteListAccessToken } = require('../utils/logic.js');
const asyncHandler = require('express-async-handler');

const verifyJWT = asyncHandler( async (req, res, next) => {

    if(!req?.cookies || !req?.cookies?._r_t)
        return res.status(401).json({ message: "Login" });

    if(!req.cookies?._a_t)
        return res.status(401).json({ message: "jwt expired" });

    const token = req.cookies._a_t;

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        asyncHandler( async (err, decoded) => {

            if(err)
                return res.status(401).json({ message: "jwt expired" }); //forbidden due to invalid token

            req.user = decoded.user;

            req.token_exp = (decoded.exp * 1000) - (decoded.iat * 1000);

            if(req?.user?.email)
                req.user.email = req.user.email.toLowerCase();

            const userEmail = req.user.email;
            const allowed = await checkWhiteListAccessToken(userEmail, token);

            if(!allowed || allowed === false)
                return res.status(401).json({ message: "jwt expired" });

            next();
            
        })
    );
});

module.exports = verifyJWT;