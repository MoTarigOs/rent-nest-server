const express = require('express');
const router = express.Router();
const { createProperty, getProperty, getOwnerProperty, getProperties } = require('../Controllers/ProperityController.js');
const verifyJWT = require('../middleware/VerifyJWT.js');

router.get('/item', getProperty);

router.get('/', getProperties);

router.post('/create', verifyJWT, createProperty);

router.get('/owner', verifyJWT, getOwnerProperty);

router.get('/search/properties', getProperty);


module.exports = router;