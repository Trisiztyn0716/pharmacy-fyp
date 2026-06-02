const express = require("express");
const medicineController = require("../controllers/medicineController");
const { requireRole } = require("../middleware/authMiddleware");
const { uploadMedicineImage } = require("../middleware/medicineImageUploadMiddleware");

const router = express.Router();

router.get("/staff", requireRole("staff"), medicineController.homePage);
router.post("/medicines", requireRole("staff"), uploadMedicineImage, medicineController.createMedicine);
router.get("/staff/medicines/:id/edit", requireRole("staff"), medicineController.editMedicinePage);
router.post("/staff/medicines/:id/update", requireRole("staff"), uploadMedicineImage, medicineController.updateMedicine);
router.post("/staff/medicines/:id/delete", requireRole("staff"), medicineController.deleteMedicine);
router.get("/staff/search", requireRole("staff"), medicineController.searchMedicinePage);

// API route for mobile app / frontend integration
router.get("/api/medicine-info/:name", medicineController.getMedicineInfoApi);

module.exports = router;
