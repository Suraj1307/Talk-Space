const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db.js");
const Chat = require("./models/chatModel.js");
const Message = require("./models/messageModel.js");
const User = require("./models/userModel.js");
const userRoutes = require("./routes/userRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");

dotenv.config();

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const app = express();
const PORT = process.env.PORT || 5000;
const BODY_LIMIT = process.env.BODY_LIMIT || "1mb";
const normalizeOrigin = (origin = "") => origin.replace(/\/+$/, "");
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://127.0.0.1:3000",
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
  ].map(normalizeOrigin)
);
const isProduction = process.env.NODE_ENV === "production";
const trustProxy = process.env.TRUST_PROXY;
const enableRateLimit =
  process.env.ENABLE_RATE_LIMIT === "true" ||
  (process.env.ENABLE_RATE_LIMIT !== "false" && isProduction);
const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisPassword = process.env.REDIS_PASSWORD;
const redisUsername = process.env.REDIS_USERNAME;

const createRedisClient = () => {
  if (!redisUrl && !redisHost) return null;

  const client = redisUrl
    ? new Redis(redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false })
    : new Redis({
        host: redisHost,
        port: redisPort,
        username: redisUsername,
        password: redisPassword,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

  client.on("error", (error) => {
    console.error("Redis rate limit store error:", error.message);
  });

  return client;
};

const redisClient = createRedisClient();

const buildRateLimitStore = (prefix) => {
  if (!redisClient) return undefined;

  return new RedisStore({
    prefix,
    sendCommand: (...args) => redisClient.call(...args),
  });
};

const createRateLimiter = ({ windowMs, limit, prefix, message, skip }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-6",
    legacyHeaders: false,
    message: { message },
    skip: (req, res) => !enableRateLimit || (typeof skip === "function" ? skip(req, res) : false),
    store: buildRateLimitStore(prefix),
    passOnStoreError: !isProduction,
  });

const writeApiLimiter = createRateLimiter({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  limit: Number(process.env.API_RATE_LIMIT_MAX || 300),
  prefix: "rl:write:",
  message: "Too many write requests. Please slow down and try again.",
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
});

const authLimiter = createRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 50),
  prefix: "rl:auth:",
  message: "Too many authentication attempts. Please try again later.",
  skip: (req) => req.method !== "POST",
});

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin || allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

if (trustProxy) {
  app.set("trust proxy", trustProxy === "true" ? 1 : trustProxy);
} else if (isProduction) {
  app.set("trust proxy", 1);
}

// ✅ CORS must be first — before body parsers and routes
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Rate limiters — /api/user covers /api/user/login too, no need to list it twice
app.use("/api/user", authLimiter);
app.use("/api/chat", writeApiLimiter);
app.use("/api/message", writeApiLimiter);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/build");
  console.log("Serving static from:", buildPath);
  console.log("Build exists?", fs.existsSync(path.join(buildPath, "index.html")));

  app.use(express.static(buildPath));
  app.get("*", (req, res) => res.sendFile(path.resolve(buildPath, "index.html")));
} else {
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

app.use(notFound);
app.use(errorHandler);

let server;
const io = new Server({
  pingTimeout: 60000,
  cors: corsOptions,
});

const onlineUsers = new Map();

const emitPresence = (userId, isOnline, extra = {}) => {
  io.emit("presence update", {
    userId: userId?.toString(),
    isOnline,
    lastSeenAt: extra.lastSeenAt || new Date().toISOString(),
    visibilityStatus: extra.visibilityStatus || "online",
  });
};

const emitMessageStatusUpdate = async (messageId) => {
  const message = await Message.findById(messageId)
    .populate("chat", "users")
    .populate("sender", "name pic email visibilityStatus lastSeenAt");

  if (!message?.chat?.users?.length) return;

  const payload = {
    messageId: message._id.toString(),
    deliveredTo: (message.deliveredTo || []).map((id) => id.toString()),
    readBy: (message.readBy || []).map((id) => id.toString()),
  };

  message.chat.users.forEach((userId) => {
    io.to(userId.toString()).emit("message status updated", payload);
  });
};

io.on("connection", (socket) => {
  console.log("Socket connected");

  socket.on("setup", (payload) => {
    try {
      const token =
        typeof payload === "string"
          ? payload
          : payload?.token || payload?.accessToken;

      if (!token) {
        socket.emit("socket_error", "Authentication token required");
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      socket.join(decoded.id);
      const socketCount = onlineUsers.get(decoded.id) || 0;
      onlineUsers.set(decoded.id, socketCount + 1);
      User.findByIdAndUpdate(decoded.id, { lastSeenAt: new Date() }).catch(() => null);
      console.log("User joined personal room:", decoded.id);
      emitPresence(decoded.id, true);
      socket.emit("connected");
    } catch (error) {
      socket.emit("socket_error", "Authentication failed");
    }
  });

  socket.on("join chat", async (room) => {
    if (!socket.data.userId) {
      socket.emit("socket_error", "Authentication required");
      return;
    }

    const chat = await Chat.findOne({
      _id: room,
      users: { $elemMatch: { $eq: socket.data.userId } },
    }).select("_id");

    if (!chat) {
      socket.emit("socket_error", "You do not have access to that chat");
      return;
    }

    socket.join(room);
    console.log("User joined chat room:", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("visibility update", async (visibilityStatus) => {
    if (!socket.data.userId || !["online", "away"].includes(visibilityStatus)) return;

    await User.findByIdAndUpdate(socket.data.userId, {
      visibilityStatus,
      lastSeenAt: new Date(),
    }).catch(() => null);

    emitPresence(socket.data.userId, true, { visibilityStatus });
  });

  socket.on("message delivered", async ({ messageIds = [] }) => {
    if (!socket.data.userId || !Array.isArray(messageIds) || !messageIds.length) return;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: socket.data.userId },
        deliveredTo: { $ne: socket.data.userId },
      },
      { $addToSet: { deliveredTo: socket.data.userId } }
    );

    await Promise.all(messageIds.map((messageId) => emitMessageStatusUpdate(messageId)));
  });

  socket.on("messages read", async ({ chatId }) => {
    if (!socket.data.userId || !chatId) return;

    const messages = await Message.find({
      chat: chatId,
      sender: { $ne: socket.data.userId },
      readBy: { $ne: socket.data.userId },
    }).select("_id");

    if (!messages.length) return;

    await Message.updateMany(
      { _id: { $in: messages.map((message) => message._id) } },
      { $addToSet: { readBy: socket.data.userId, deliveredTo: socket.data.userId } }
    );

    await Promise.all(messages.map((message) => emitMessageStatusUpdate(message._id)));
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat?.users) {
      console.log("chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      console.log("Emitting message to:", user._id);
      socket.in(user._id).emit("message recieved", newMessageReceived);
    });

    emitMessageStatusUpdate(newMessageReceived._id).catch(() => null);
  });

  socket.on("disconnect", () => {
    if (socket.data.userId) {
      console.log("User disconnected:", socket.data.userId);
      socket.leave(socket.data.userId);
      const nextCount = Math.max((onlineUsers.get(socket.data.userId) || 1) - 1, 0);
      if (nextCount === 0) {
        onlineUsers.delete(socket.data.userId);
        const lastSeenAt = new Date();
        User.findByIdAndUpdate(socket.data.userId, { lastSeenAt }).catch(() => null);
        emitPresence(socket.data.userId, false, { lastSeenAt: lastSeenAt.toISOString() });
      } else {
        onlineUsers.set(socket.data.userId, nextCount);
      }
    }
  });
});

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    if (redisClient) {
      await redisClient.quit();
    }

    await mongoose.connection.close(false);
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  shutdown("unhandledRejection");
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal);
  });
});

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  io.attach(server);
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});