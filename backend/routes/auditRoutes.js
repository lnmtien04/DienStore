const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  completeAudit,
  cancelAudit,
} = require('../controllers/auditController');

router.use(protect, authorize('admin'));

router.route('/')
  .get(getAudits)
  .post(createAudit);

router.route('/:id')
  .get(getAuditById)
  .put(updateAudit);

router.post('/:id/complete', completeAudit);
router.post('/:id/cancel', cancelAudit);

module.exports = router;