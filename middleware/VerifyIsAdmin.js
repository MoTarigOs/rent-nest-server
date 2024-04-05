const asyncHandler = require("express-async-handler");
const User = require('../Data/UserModel');
const { default: mongoose } = require("mongoose");

const verifyAdmin = asyncHandler( async(req, res, next) => {

    if(!req?.user) return res.status(400).json({ message: 'request error' });

    const { id } = req.user;

    if(!id || !mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: 'request error' });

    const user = await User.findOne({ _id: id, role: ['admin', 'owner'] });
    
    if(!user) return res.status(403).json({ message: 'not allowed error' });

    next();

});

module.exports = verifyAdmin;