const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const ensureChatMember = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    users: { $elemMatch: { $eq: userId } },
  });

  if (!chat) {
    const error = new Error("Chat Not Found");
    error.statusCode = 404;
    throw error;
  }

  return chat;
};

const populateMessage = async (message) => {
  let populatedMessage = await message.populate("sender", "name pic email visibilityStatus lastSeenAt");
  populatedMessage = await populatedMessage.populate("chat");
  populatedMessage = await User.populate(populatedMessage, {
    path: "chat.users",
    select: "name pic email visibilityStatus lastSeenAt",
  });

  return populatedMessage;
};

const markMessagesReadForUser = async (chatId, userId) =>
  Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId, deliveredTo: userId } }
  );

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    await ensureChatMember(req.params.chatId, req.user._id);
    await markMessagesReadForUser(req.params.chatId, req.user._id);

    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, clientId } = req.body;
  const trimmedContent = (content || "").trim();

  if (!trimmedContent || !chatId) {
    res.status(400);
    throw new Error("content and chatId are required");
  }

  const chat = await ensureChatMember(chatId, req.user._id);

  var newMessage = {
    sender: req.user._id,
    content: trimmedContent,
    chat: chatId,
    clientId,
    deliveredTo: [req.user._id],
    readBy: [req.user._id],
  };

  try {
    var message = await Message.create(newMessage);
    message = await populateMessage(message);

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw new Error(error.message);
  }
});

const markDelivered = asyncHandler(async (req, res) => {
  const { messageIds = [] } = req.body;

  if (!Array.isArray(messageIds) || !messageIds.length) {
    return res.json({ updated: 0 });
  }

  const result = await Message.updateMany(
    {
      _id: { $in: messageIds },
      sender: { $ne: req.user._id },
      deliveredTo: { $ne: req.user._id },
    },
    { $addToSet: { deliveredTo: req.user._id } }
  );

  res.json({ updated: result.modifiedCount || 0 });
});

const markRead = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    res.status(400);
    throw new Error("chatId is required");
  }

  await ensureChatMember(chatId, req.user._id);
  const result = await markMessagesReadForUser(chatId, req.user._id);

  res.json({ updated: result.modifiedCount || 0 });
});

module.exports = { allMessages, sendMessage, markDelivered, markRead };
