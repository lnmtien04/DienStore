const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup
} = require('../controllers/backupController');

router.use(protect, authorize('admin'));

router.route('/')
  .get(listBackups)
  .post(createBackup);

router.route('/:filename')
  .get(downloadBackup)
  .delete(deleteBackup);

module.exports = router;