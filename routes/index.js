const express = require('express');
const router = express.Router();
const multer = require('multer');

const import_xls = require('../controllers/import-controllern')

// Set up multer to store files in memory

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Upload XLS' });
});

router.post('/import-xls', upload.single("fileUpload"), import_xls);

module.exports = router;
