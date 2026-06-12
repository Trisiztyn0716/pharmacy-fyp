const express = require("express");
const purchaseController = require("../controllers/purchaseController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/user/purchases", requireRole("customer"), purchaseController.createPurchase);
router.get("/staff/sales", requireRole("staff"), purchaseController.salesPage);
router.post("/staff/sales/:id/status", requireRole("staff"), purchaseController.updatePurchaseStatus);

module.exports = router;
