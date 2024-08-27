const express = require('express');
const { registerUser, sendCodeToEmail, verifyEmail, loginUser, getUserInfo, refreshToken, changePassword, logoutUser, deleteAccount, getFavourites, addToFavourite, removeFromFavourite, getBooks, addToBooks, removeFromBooks, editUser, getAllUploadedFiles, getSecretStorageKey, sendCodeToEmailSignPage, verifyEmailSignPage, changePasswordSignPage, verifyGuestBook, deleteGuestBook, getGuests, checkUsername, askConvertToHost, deleteNotifications, enableNotif } = require('../Controllers/UserController.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const verifyReCaptcha = require('../middleware/VerifyReCaptcha.js');
const router = express.Router();

router.post("/register", verifyReCaptcha, registerUser);

router.get("/check-username/:username", checkUsername);

router.post("/send-code", verifyJWT, sendCodeToEmail);

router.post("/send-code-sign-page", sendCodeToEmailSignPage);

router.post("/verify-email", verifyJWT, verifyEmail);

router.post("/change-password-sign-page", verifyReCaptcha, changePasswordSignPage);

router.post("/login", verifyReCaptcha, loginUser);

router.get("/info", verifyJWT, getUserInfo);

router.post("/refresh-token", refreshToken);

router.post("/change-password", changePassword);

router.post("/logout", verifyJWT, logoutUser);

router.put("/ask-for-host", verifyJWT, askConvertToHost);

router.delete("/delete", verifyJWT, deleteAccount);


router.get("/favourites", verifyJWT, getFavourites);

router.put("/favourites/:propertyId", verifyJWT, addToFavourite);

router.delete("/favourites/:propertyId", verifyJWT, removeFromFavourite);


router.get("/books", verifyJWT, getBooks);

router.put("/books/:propertyId", verifyJWT, addToBooks);

router.delete("/books/:propertyId", verifyJWT, removeFromBooks);


router.get('/guests', verifyJWT, getGuests);

router.patch('/verify-guest', verifyJWT, verifyGuestBook);

router.delete('/guest', verifyJWT, deleteGuestBook);

router.delete('/delete-notifications/:ids', verifyJWT, deleteNotifications);

router.patch("/enable-notif", verifyJWT, enableNotif);

router.patch("/edit", verifyJWT, editUser);

module.exports = router;