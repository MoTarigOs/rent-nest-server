const express = require('express');
const verifyAdmin = require('../middleware/VerifyIsAdmin.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const { getReports, getPropertiesForCheck, passProperty, deletePropertyAdmin, getHiddenProperties, hidePropertyAdmin, showPropertyAdmin, deleteReviewAdmin, getUsers, getUserByEmail, blockUser, unBlockUser, deleteAccountAdmin, getPropertiesByFilesDetails, deleteReviewsAdmin, promoteToAdmin, demoteFromAdmin, getErrorsOccured, deleteReport, deleteErrorOccured, rejectProperty, convertToHost, getUserById, setAbleToBookAdmin, setPreventBookAdmin, setBookedDaysAdmin, editPropertyAdmin, getAdminNotif, addBadge, removeBadge, setIsDealTrue, setIsDealFalse, addReviewAdmin } = require('../Controllers/AdminController.js');
const verifyOwner = require('../middleware/VerifyIsOwner.js');
const verifyReCaptcha = require('../middleware/VerifyReCaptcha.js');
const router = express.Router();

router.get('/reports', verifyJWT, verifyAdmin, getReports);

router.delete('/reports/:propertyId', verifyJWT, verifyAdmin, deleteReport);

router.get('/errors', verifyJWT, verifyAdmin, getErrorsOccured);

router.delete('/errors/:errorId', verifyJWT, verifyAdmin, deleteErrorOccured);

router.get('/check-properties', verifyJWT, verifyAdmin, getPropertiesForCheck);

router.get('/hidden-properties', verifyJWT, verifyAdmin, getHiddenProperties);

router.get('/properties-by-files', verifyJWT, verifyAdmin, getPropertiesByFilesDetails);

router.put('/pass-property/:propertyId', verifyJWT, verifyAdmin, passProperty);

router.put('/reject-property/:propertyId', verifyJWT, verifyAdmin, rejectProperty);

router.delete('/delete-property/:propertyId', verifyJWT, verifyAdmin, deletePropertyAdmin);

router.put('/hide-property/:propertyId', verifyJWT, verifyAdmin, hidePropertyAdmin);

router.put('/show-property/:propertyId', verifyJWT, verifyAdmin, showPropertyAdmin);

router.post('/delete-reviews/:propertyId', verifyJWT, verifyAdmin, deleteReviewsAdmin);

router.put('/write-review/:propertyId', verifyJWT, verifyAdmin, addReviewAdmin);

router.get('/users', verifyJWT, verifyAdmin, getUsers);

router.get('/user-by-email/:email', verifyJWT, verifyAdmin, getUserByEmail);

router.get('/user-by-id/:userId', verifyJWT, verifyAdmin, getUserById);

router.put('/block-user/:userId', verifyJWT, verifyAdmin, blockUser);

router.put('/un-block-user/:userId', verifyJWT, verifyAdmin, unBlockUser);

router.delete('/user-account/:userId', verifyJWT, verifyAdmin, deleteAccountAdmin);

router.put('/promote-to-admin', verifyJWT, verifyOwner, promoteToAdmin);

router.put('/demote-from-admin', verifyJWT, verifyOwner, demoteFromAdmin);

router.put('/convert-to-host/:userId', verifyJWT, verifyAdmin, convertToHost);

router.put('/able-to-book/:propertyId', verifyJWT, verifyAdmin, setAbleToBookAdmin);

router.put('/prevent-book/:propertyId', verifyJWT, verifyAdmin, setPreventBookAdmin);

router.put('/booked-days/:propertyId', verifyJWT, verifyAdmin, setBookedDaysAdmin);

router.put('/edit/:propertyId', verifyJWT, verifyReCaptcha, verifyAdmin, editPropertyAdmin);

router.get('/notifs', verifyJWT, verifyAdmin, getAdminNotif);

router.put('/add-badge/:propertyId', verifyJWT, verifyAdmin, addBadge);

router.put('/remove-badge/:propertyId', verifyJWT, verifyAdmin, removeBadge);

router.put('/add-deal/:propertyId', verifyJWT, verifyAdmin, setIsDealTrue);

router.put('/remove-deal/:propertyId', verifyJWT, verifyAdmin, setIsDealFalse);






// router.get('/promote-to-owner', verifyJWT, verifyOwner, toOwner);

router.get('/test-is-admin', verifyJWT, verifyAdmin, (req, res) => {
    res.status(200).json({ message: 'is admin true' });
});

router.get('/test-is-owner', verifyJWT, verifyOwner, (req, res) => {
    res.status(200).json({ message: 'is owner true' });
});

module.exports = router;