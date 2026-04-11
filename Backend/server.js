const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db.js");
const Chat = require("./models/chatModel.js");
const userRoutes = require("./routes/userRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

connectDB();

const app = express();
const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const configuredOrigins = (process.env.SOCKET_CORS_ORIGIN || FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3})(:\d+)?$/i;
const secureOriginPattern = /^https:\/\/[^/]+$/i;
const allowedOrigins = Array.from(new Set(configuredOrigins.map(normalizeOrigin)));
const PORT = process.env.PORT || 5000;
const shouldAllowLocalNetwork = allowedOrigins.every((origin) =>
  localDevOriginPattern.test(origin)
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.includes(normalizedOrigin)) return true;

  if (shouldAllowLocalNetwork) {
    return (
      localDevOriginPattern.test(normalizedOrigin) ||
      secureOriginPattern.test(normalizedOrigin)
    );
  }

  return false;
};

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

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

const server = app.listen(PORT, () =>
  console.log(`Server is running on port ${PORT}`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

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
      console.log("User joined personal room:", decoded.id);
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
  });

  socket.on("disconnect", () => {
    if (socket.data.userId) {
      console.log("User disconnected:", socket.data.userId);
      socket.leave(socket.data.userId);
    }
  });
});
