const express = require("express");
const authController = require("../controllers/authController");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authController.rootPage);
router.get("/login", authController.loginPage);
router.post("/login", authController.login);
router.get("/signup", authController.signupPage);
router.post("/signup/customer", authController.signupCustomer);
router.post("/signup/staff", authController.signupStaff);
router.get("/signup/staff/verify", authController.staffVerificationPage);
router.post("/signup/staff/verify", authController.verifyStaffSignup);
router.post("/logout", authController.logout);
router.get("/user/home", requireRole("customer"), authController.userHome);

module.exports = router;
