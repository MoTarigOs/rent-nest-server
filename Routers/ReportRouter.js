const express = require('express');
const { reportProperty, reportReview } = require('../Controllers/ReportController.js');
const verifyJWT = require('../middleware/VerifyJWT.js');
const router = express.Router();

router.post('/', verifyJWT, reportProperty);

router.post('/review', verifyJWT, reportReview);

module.exports = router;