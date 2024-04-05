const express = require('express');
const router = express.Router();
const { createProperty, getProperty, getOwnerProperty, getProperties, addReview, editProperty, hideProperty, showProperty, deleteProperty, updateCoordinates, setAbleToBook, setPreventBook, setBookedDays } = require('../Controllers/ProperityController.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const verifyJWTOptional = require('../middleware/VerifyOptionalJWT.js');

router.get('/item', getProperty);

router.get('/', verifyJWTOptional, getProperties);

router.post('/create', verifyJWT, createProperty);

router.get('/owner/:userId', getOwnerProperty);

router.put('/edit/:propertyId', verifyJWT, editProperty);

router.put('/hide/:propertyId', verifyJWT, hideProperty);

router.put('/show/:propertyId', verifyJWT, showProperty);

router.put('/able-to-book/:propertyId', verifyJWT, setAbleToBook);

router.put('/prevent-book/:propertyId', verifyJWT, setPreventBook);

router.put('/booked-days/:propertyId', verifyJWT, setBookedDays);

router.put('/write-review', verifyJWT, addReview);

router.delete('/delete/:propertyId', verifyJWT, deleteProperty);

module.exports = router;