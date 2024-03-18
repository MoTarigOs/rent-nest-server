const express = require('express');
const { registerUser, sendCodeToEmail, verifyEmail, loginUser, getUserInfo } = require('../Controllers/UserController');
const router = express.Router();
const verifyJWT = require('../Middlewares/VerifyJWT');

//router.use((req, res) => {return res.status(400).json({ message: `router reached: ${req.url}`})});

router.post("/register", registerUser);

router.post("/send-code", sendCodeToEmail);

router.get("/verify-email", verifyEmail);

router.post("/login", loginUser);

router.get("/info", verifyJWT, getUserInfo);

// router.post("/refresh-token", refreshToken);

// router.post("/change-password", changePassword);

// router.post("/change-password-email-code", changePasswordEmailCode);

// router.post("/logout", logoutUser);

// router.delete("/delete", deleteAccount);

module.exports = router;