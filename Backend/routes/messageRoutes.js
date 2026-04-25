const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { sendMessage, allMessages, markDelivered, markRead } =require("../controllers/messageController");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/delivered").post(protect, markDelivered);
router.route("/read").post(protect, markRead);
router.route("/:chatId").get(protect, allMessages);

module.exports = router;
