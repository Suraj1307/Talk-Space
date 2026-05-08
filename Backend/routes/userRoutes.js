const express = require("express");
const {
  registerUser,
  authUser,
  syncClerkUser,
  allUsers,
  getCloudinarySignature,
  updateVisibilityStatus,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/cloudinary-signature", getCloudinarySignature);
router.post("/clerk/sync", syncClerkUser);
router.put("/visibility", protect, updateVisibilityStatus);
router.route("/").get(protect, allUsers);
router.route("/").post(registerUser);
router.post("/login", authUser);

module.exports = router;
