const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const userRoutes = require("./routes/userRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load .env and connect to DB
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PORT = process.env.PORT || 5000;

// ----- PRODUCTION STATIC FILE SERVE -----
if (process.env.NODE_ENV === "production") {
  // Build directory path (relative to Backend/server.js)
  const buildPath = path.join(__dirname, "../frontend/build");
  console.log("Serving static from:", buildPath);
  console.log("Build exists?", fs.existsSync(path.join(buildPath, "index.html")));

  // Serve static files
  app.use(express.static(buildPath));

  // Fallback route: serve React index.html for any other route
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(buildPath, "index.html"))
  );
} else {
  // Local dev root route
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// Error handlers
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () =>
  console.log(`Server is running on port ${PORT}`)
);

// --- Socket.IO setup ---
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://talk-space-z1i1.onrender.com",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log("User joined personal room:", userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat room:", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    const chat = newMessageRecieved.chat;
    if (!chat?.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;
      console.log("📨 Emitting message to:", user._id);
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", (userData) => {
    console.log("🔴 User disconnected:", userData?._id);
    socket.leave(userData?._id);
  });
});
