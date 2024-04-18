const express = require('express');
const { registerUser, sendCodeToEmail, verifyEmail, loginUser, getUserInfo, refreshToken, changePassword, logoutUser, deleteAccount, getFavourites, addToFavourite, removeFromFavourite, getBooks, addToBooks, removeFromBooks, editUser, getAllUploadedFiles, getSecretStorageKey, sendCodeToEmailSignPage, verifyEmailSignPage, changePasswordSignPage } = require('../Controllers/UserController.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const router = express.Router();

router.post("/register", registerUser);

router.post("/send-code", verifyJWT, sendCodeToEmail);

router.post("/send-code-sign-page", sendCodeToEmailSignPage);

router.post("/verify-email", verifyJWT, verifyEmail);

router.post("/change-password-sign-page", changePasswordSignPage);

router.post("/login", loginUser);

router.get("/info", verifyJWT, getUserInfo);

router.post("/refresh-token", refreshToken);

router.post("/change-password", changePassword);

router.post("/logout", verifyJWT, logoutUser);

router.delete("/delete", verifyJWT, deleteAccount);


router.get("/favourites", verifyJWT, getFavourites);

router.put("/favourites/:propertyId", verifyJWT, addToFavourite);

router.delete("/favourites/:propertyId", verifyJWT, removeFromFavourite);


router.get("/books", verifyJWT, getBooks);

router.put("/books/:propertyId", verifyJWT, addToBooks);

router.delete("/books/:propertyId", verifyJWT, removeFromBooks);


router.patch("/edit", verifyJWT, editUser);

module.exports = router;