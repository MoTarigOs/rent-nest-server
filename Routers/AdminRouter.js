const express = require('express');
const verifyAdmin = require('../middleware/VerifyIsAdmin.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const { getReports, getPropertiesForCheck, passProperty, deletePropertyAdmin, getHiddenProperties, hidePropertyAdmin, showPropertyAdmin, deleteReviewAdmin, getUsers, getUserByEmail, blockUser, unBlockUser, deleteAccountAdmin, getPropertiesByFilesDetails, deleteReviewsAdmin, promoteToAdmin, demoteFromAdmin } = require('../Controllers/AdminController.js');
const verifyOwner = require('../middleware/VerifyIsOwner.js');
const router = express.Router();

router.get('/reports', verifyJWT, verifyAdmin, getReports);

router.get('/check-properties', verifyJWT, verifyAdmin, getPropertiesForCheck);

router.get('/hidden-properties', verifyJWT, verifyAdmin, getHiddenProperties);

router.get('/properties-by-files', verifyJWT, verifyAdmin, getPropertiesByFilesDetails);

router.put('/pass-property/:propertyId', verifyJWT, verifyAdmin, passProperty);

router.delete('/delete-property/:propertyId', verifyJWT, verifyAdmin, deletePropertyAdmin);

router.put('/hide-property/:propertyId', verifyJWT, verifyAdmin, hidePropertyAdmin);

router.put('/show-property/:propertyId', verifyJWT, verifyAdmin, showPropertyAdmin);

router.post('/delete-reviews/:propertyId', verifyJWT, verifyAdmin, deleteReviewsAdmin);

router.get('/users', verifyJWT, verifyAdmin, getUsers);

router.get('/user-by-email/:email', verifyJWT, verifyAdmin, getUserByEmail);

router.put('/block-user/:userId', verifyJWT, verifyAdmin, blockUser);

router.put('/un-block-user/:userId', verifyJWT, verifyAdmin, unBlockUser);

router.delete('/user-account/:userId', verifyJWT, verifyAdmin, deleteAccountAdmin);

router.put('/promote-to-admin', verifyJWT, verifyOwner, promoteToAdmin);

router.put('/demote-from-admin', verifyJWT, verifyOwner, demoteFromAdmin);

// router.get('/promote-to-owner', verifyJWT, verifyOwner, toOwner);

router.get('/test-is-admin', verifyJWT, verifyAdmin, (req, res) => {
    res.status(200).json({ message: 'is admin true' });
});

router.get('/test-is-owner', verifyJWT, verifyOwner, (req, res) => {
    res.status(200).json({ message: 'is owner true' });
});

module.exports = router;