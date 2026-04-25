const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");

const findChatForUser = (chatId, userId) =>
  Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  });

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error("userId is required");
  }

  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot create a chat with yourself");
  }

  const targetUser = await User.findById(userId).select("_id");
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name pic email visibilityStatus lastSeenAt",
      },
    });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    let results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name pic email visibilityStatus lastSeenAt",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).send(results);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  const uniqueUserIds = [...new Set([...users, req.user._id.toString()])];

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: uniqueUserIds,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const chat = await Chat.findById(chatId).select("groupAdmin isGroupChat users");
  if (!chat || !chat.users.some((id) => id.toString() === req.user._id.toString())) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Only group chats can be renamed");
  }

  if (chat.groupAdmin?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only group admins can rename the chat");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId).select("groupAdmin isGroupChat users");
  if (!chat || !chat.users.some((id) => id.toString() === req.user._id.toString())) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Only group chats can remove members");
  }

  const isAdmin = chat.groupAdmin?.toString() === req.user._id.toString();
  const isSelfRemoval = userId === req.user._id.toString();

  if (!isAdmin && !isSelfRemoval) {
    res.status(403);
    throw new Error("Only group admins can remove other users");
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId).select("groupAdmin isGroupChat users");
  if (!chat || !chat.users.some((id) => id.toString() === req.user._id.toString())) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Only group chats can add members");
  }

  if (chat.groupAdmin?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only group admins can add users");
  }

  if (chat.users.some((id) => id.toString() === userId)) {
    res.status(400);
    throw new Error("User already in group");
  }

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});



const removeUserChat = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  const existingChat = await findChatForUser(chatId, req.user._id);
  if (!existingChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  // Remove user from chat
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: req.user._id } },
    { new: true }
  );

  // If no users left → delete chat
  if (updatedChat && updatedChat.users.length === 0) {
    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chat: chatId });
  }

  res.json({ success: true });
});



module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  removeUserChat,  
};
