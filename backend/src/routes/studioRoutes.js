const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createStudio,
  listStudios,
  getStudio,
  updateStudio,
  deleteStudio,
} = require('../controllers/studioController');

/**
 * @swagger
 * /api/studios:
 *   get:
 *     summary: List all studios
 *     tags: [Studios]
 *     responses:
 *       200: { description: List of studios }
 *   post:
 *     summary: Create a studio (engineer only)
 *     tags: [Studios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Studio created }
 */
router.get('/', listStudios);
router.post('/', authenticate, authorize('engineer', 'admin'), createStudio);

/**
 * @swagger
 * /api/studios/{id}:
 *   get:
 *     summary: Get a studio by id
 *     tags: [Studios]
 *   put:
 *     summary: Update a studio (owner engineer only)
 *     tags: [Studios]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete a studio (owner engineer only)
 *     tags: [Studios]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', getStudio);
router.put('/:id', authenticate, authorize('engineer', 'admin'), updateStudio);
router.delete('/:id', authenticate, authorize('engineer', 'admin'), deleteStudio);

module.exports = router;
