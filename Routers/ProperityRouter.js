const express = require('express');
const router = express.Router();
const verifyJWT = require('../Middlewares/VerifyJWT');
const { createProperty, getProperty, getOwnerProperty, getProperties } = require('../Controllers/ProperityController');

router.get('/item', getProperty);

router.get('/', getProperties);

router.post('/create', verifyJWT, createProperty);

router.get('/owner', verifyJWT, getOwnerProperty);

router.get('/search/properties', getProperty);


module.exports = router;