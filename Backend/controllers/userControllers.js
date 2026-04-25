const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const defaultPic =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const validateEmail = (email = "") => /\S+@\S+\.\S+/.test(email);
const sanitizeName = (name = "") => name.trim().replace(/\s+/g, " ");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("name email pic visibilityStatus lastSeenAt");
  res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  const normalizedName = sanitizeName(name);
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  if (normalizedName.length < 2) {
    res.status(400);
    throw new Error("Name must be at least 2 characters");
  }

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
    pic: typeof pic === "string" && /^https?:\/\//i.test(pic) ? pic : defaultPic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      visibilityStatus: user.visibilityStatus,
      lastSeenAt: user.lastSeenAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    user.lastSeenAt = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      visibilityStatus: user.visibilityStatus,
      lastSeenAt: user.lastSeenAt,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

//@description     Get signed Cloudinary upload params
//@route           GET /api/user/cloudinary-signature
//@access          Public
const getCloudinarySignature = asyncHandler(async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || "chat-app";

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(503);
    throw new Error("Image upload is not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  res.json({
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature,
    allowedFormats: ["jpg", "jpeg", "png"],
    maxFileSizeBytes: 10 * 1024 * 1024,
  });
});

const updateVisibilityStatus = asyncHandler(async (req, res) => {
  const { visibilityStatus } = req.body;

  if (!["online", "away"].includes(visibilityStatus)) {
    res.status(400);
    throw new Error("Invalid visibility status");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { visibilityStatus, lastSeenAt: new Date() },
    { new: true }
  ).select("name email pic visibilityStatus lastSeenAt");

  res.json(user);
});

module.exports = {
  allUsers,
  registerUser,
  authUser,
  getCloudinarySignature,
  updateVisibilityStatus,
};
