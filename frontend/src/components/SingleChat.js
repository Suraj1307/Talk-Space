import "./styles.css";
import {
  Box,
  Button,
  Circle,
  FormControl,
  HStack,
  IconButton,
  Skeleton,
  Textarea,
  Text,
  Tooltip,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { HiOutlineEmojiHappy } from "react-icons/hi";
import Lottie from "react-lottie";
import io from "socket.io-client";
import Picker from "emoji-picker-react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { apiClient, getAuthConfig } from "../config/apiClient";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import animationData from "../animations/typing.json";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import { SOCKET_ENDPOINT } from "../config/appConfig";

let socket;

const createOptimisticMessage = ({ content, user, selectedChat, clientId }) => ({
  _id: clientId,
  clientId,
  content,
  chat: selectedChat,
  sender: {
    _id: user._id,
    name: user.name,
    pic: user.pic,
    visibilityStatus: user.visibilityStatus,
    lastSeenAt: user.lastSeenAt,
  },
  deliveredTo: [user._id],
  readBy: [user._id],
  createdAt: new Date().toISOString(),
  localStatus: "sending",
});

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessageIds, setSendingMessageIds] = useState([]);
  const selectedChatRef = useRef();
  const typingTimeoutRef = useRef();
  const messageInputRef = useRef(null);

  const toast = useToast();
  const {
    selectedChat,
    setSelectedChat,
    user,
    setNotification,
    openSearchDrawer,
    setChats,
    onlineUsers,
    setOnlineUsers,
  } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  const otherUser = useMemo(
    () => (!selectedChat?.isGroupChat ? getSenderFull(user, selectedChat?.users) : null),
    [selectedChat, user]
  );

  const autosizeComposer = useCallback(() => {
    const input = messageInputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }, []);

  const syncChatPreview = useCallback(
    (incomingMessage) => {
      setChats((prevChats = []) => {
        const existingIndex = prevChats.findIndex((chat) => chat._id === incomingMessage.chat._id);

        if (existingIndex === -1) {
          return prevChats;
        }

        const updatedChat = {
          ...prevChats[existingIndex],
          latestMessage: incomingMessage,
          updatedAt: incomingMessage.createdAt || new Date().toISOString(),
        };

        return [
          updatedChat,
          ...prevChats.filter((chat) => chat._id !== incomingMessage.chat._id),
        ];
      });
    },
    [setChats]
  );

  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !user?.token) return;

    try {
      setLoading(true);
      setMessagesError("");
      const { data } = await apiClient.get(
        `/api/message/${selectedChat._id}`,
        getAuthConfig(user.token)
      );
      setMessages(data);
      socket?.emit("join chat", selectedChat._id);
      socket?.emit("messages read", { chatId: selectedChat._id });
      setNotification((prev) => prev.filter((item) => item.chat?._id !== selectedChat._id));
    } catch (error) {
      setMessagesError(error.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [selectedChat, setNotification, user]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    autosizeComposer();
  }, [autosizeComposer, newMessage]);

  useEffect(() => {
    if (!user?.token) return undefined;

    socket = io(SOCKET_ENDPOINT);
    socket.emit("setup", { token: user.token });

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => {
      setSocketConnected(false);
      setIsTyping(false);
    };
    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);
    const handleSocketError = (message) => {
      toast({
        title: "Realtime connection error",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    };
    const handlePresenceUpdate = (payload) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [payload.userId]: {
          isOnline: payload.isOnline,
          lastSeenAt: payload.lastSeenAt,
          visibilityStatus: payload.visibilityStatus || "online",
        },
      }));
    };
    const handleMessageStatusUpdated = ({ messageId, deliveredTo, readBy }) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === messageId
            ? {
                ...message,
                deliveredTo,
                readBy,
                localStatus: message.localStatus === "failed" ? "failed" : undefined,
              }
            : message
        )
      );
    };
    const handleVisibilityUpdated = (event) => {
      socket.emit("visibility update", event.detail);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("socket_error", handleSocketError);
    socket.on("presence update", handlePresenceUpdate);
    socket.on("message status updated", handleMessageStatusUpdated);
    window.addEventListener("talk-space-visibility-updated", handleVisibilityUpdated);

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("socket_error", handleSocketError);
      socket.off("presence update", handlePresenceUpdate);
      socket.off("message status updated", handleMessageStatusUpdated);
      window.removeEventListener("talk-space-visibility-updated", handleVisibilityUpdated);
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [setOnlineUsers, toast, user?.token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket || !user?.token) return undefined;

    const handleMessageReceived = (newMessageReceived) => {
      syncChatPreview(newMessageReceived);

      if (!selectedChatRef.current || selectedChatRef.current._id !== newMessageReceived.chat._id) {
        setNotification((prevNotification) => {
          if (prevNotification.some((item) => item._id === newMessageReceived._id)) {
            return prevNotification;
          }

          return [newMessageReceived, ...prevNotification];
        });
        setFetchAgain((prev) => !prev);
        socket.emit("message delivered", { messageIds: [newMessageReceived._id] });
        return;
      }

      setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
      socket.emit("messages read", { chatId: newMessageReceived.chat._id });
    };

    socket.on("message recieved", handleMessageReceived);

    return () => {
      socket.off("message recieved", handleMessageReceived);
    };
  }, [setFetchAgain, setNotification, syncChatPreview, user?.token]);

  const sendMessageRequest = async (draft) => {
    const { data } = await apiClient.post(
      "/api/message",
      { content: draft.content, chatId: selectedChat._id, clientId: draft.clientId },
      getAuthConfig(user?.token, { "Content-type": "application/json" })
    );

    return data;
  };

  const handleSendMessage = async (draftOverride) => {
    const contentToSend = (draftOverride?.content || newMessage).trim();
    if (!contentToSend || !selectedChat) return;

    const clientId = draftOverride?.clientId || `local-${Date.now()}`;
    const optimisticMessage =
      draftOverride || createOptimisticMessage({ content: contentToSend, user, selectedChat, clientId });

    if (!draftOverride) {
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      setNewMessage("");
      setShowEmojiPicker(false);
    } else {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.clientId === optimisticMessage.clientId
            ? { ...message, localStatus: "sending" }
            : message
        )
      );
    }

    socket?.emit("stop typing", selectedChat._id);
    clearTimeout(typingTimeoutRef.current);
    setTyping(false);
    setSendingMessageIds((prev) => [...prev, optimisticMessage.clientId]);

    try {
      const data = await sendMessageRequest(optimisticMessage);
      socket?.emit("new message", data);
      syncChatPreview(data);
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.clientId === optimisticMessage.clientId ? data : message
        )
      );
    } catch (error) {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.clientId === optimisticMessage.clientId
            ? { ...message, localStatus: "failed" }
            : message
        )
      );
      toast({
        title: "Message not sent",
        description: error.response?.data?.message || "Tap retry when you're ready",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setSendingMessageIds((prev) =>
        prev.filter((sendingId) => sendingId !== optimisticMessage.clientId)
      );
    }
  };

  const typingHandler = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socketConnected || !selectedChat) return;

    if (!value.trim()) {
      clearTimeout(typingTimeoutRef.current);
      if (typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
      return;
    }

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", selectedChat._id);
      setTyping(false);
    }, 3000);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    messageInputRef.current?.focus();
  };

  const handleComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const retryMessage = (message) => {
    handleSendMessage({
      ...message,
      content: message.content,
      clientId: message.clientId || message._id,
      localStatus: "sending",
    });
  };

  const onlineState = otherUser ? onlineUsers[otherUser._id] : null;
  const otherUserLabel = otherUser
    ? onlineState?.isOnline
      ? onlineState.visibilityStatus === "away"
        ? "Away"
        : "Online"
      : onlineState?.lastSeenAt
        ? `Last active ${new Date(onlineState.lastSeenAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`
        : "Offline"
    : "";

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            pb={3}
            px={2}
            w="100%"
            display="flex"
            alignItems={{ base: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={3}
            flexWrap="wrap"
          >
            <VStack align="start" spacing={1} minW={0} flex="1">
              <HStack spacing={3} minW={0} w="100%">
                <IconButton
                  display={{ base: "flex", md: "none" }}
                  icon={<ArrowBackIcon />}
                  aria-label="Back to chats"
                  onClick={() => setSelectedChat(null)}
                  flexShrink={0}
                />
                <Text
                  fontSize={{ base: "20px", md: "30px" }}
                  fontFamily="Work sans"
                  fontWeight="700"
                  minW={0}
                  noOfLines={2}
                  wordBreak="break-word"
                >
                  {!selectedChat.isGroupChat
                    ? getSender(user, selectedChat.users)
                    : selectedChat.chatName.toUpperCase()}
                </Text>
              </HStack>
              {!selectedChat.isGroupChat && otherUserLabel ? (
                <HStack spacing={2} pl={{ base: 0, md: 0 }}>
                  <Circle size="8px" bg={onlineState?.isOnline ? "green.400" : "gray.300"} />
                  <Text fontSize="sm" color="gray.500">
                    {otherUserLabel}
                  </Text>
                </HStack>
              ) : null}
            </VStack>

            <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
              {!selectedChat.isGroupChat ? (
                <ProfileModal user={{ ...otherUser, ...onlineState }} />
              ) : (
                <UpdateGroupChatModal
                  fetchMessages={fetchMessages}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              )}
            </Box>
          </Box>

          {!socketConnected ? (
            <Box
              w="100%"
              mb={3}
              p={3}
              borderRadius="xl"
              bg="orange.50"
              borderWidth="1px"
              borderColor="orange.100"
            >
              <Text fontWeight="600" color="gray.700">
                Live updates are reconnecting.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Messages still send through the API, but typing and instant delivery may lag briefly.
              </Text>
            </Box>
          ) : null}

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="rgba(255,255,255,0.72)"
            w="100%"
            h="100%"
            minH={0}
            borderRadius="2xl"
            overflowY="hidden"
          >
            {loading ? (
              <VStack spacing={4} align="stretch" px={2} py={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} height="52px" borderRadius="2xl" />
                ))}
              </VStack>
            ) : messagesError ? (
              <Box
                className="messages"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="xl"
                bg="red.50"
                borderWidth="1px"
                borderColor="red.100"
                px={6}
              >
                <VStack spacing={3}>
                  <Text color="gray.700" textAlign="center">
                    {messagesError}
                  </Text>
                  <Button size="sm" colorScheme="red" borderRadius="full" onClick={fetchMessages}>
                    Retry loading messages
                  </Button>
                </VStack>
              </Box>
            ) : messages.length ? (
              <div className="messages">
                <ScrollableChat
                  messages={messages}
                  selectedChat={selectedChat}
                  onRetryMessage={retryMessage}
                />
              </div>
            ) : (
              <Box
                className="messages"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="xl"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.100"
              >
                <Text color="gray.600" textAlign="center" px={6}>
                  No messages yet. Send the first one to start the conversation.
                </Text>
              </Box>
            )}

            <FormControl
              id="message-input"
              isRequired
              mt={3}
              position="sticky"
              bottom="0"
              pt={2}
              bg="rgba(255,255,255,0.88)"
              borderTopWidth="1px"
              borderColor="blackAlpha.50"
            >
              {isTyping ? (
                <div>
                  <Lottie options={defaultOptions} width={70} style={{ marginBottom: 8, marginLeft: 0 }} />
                </div>
              ) : null}

              <Box
                display="flex"
                alignItems="flex-end"
                position="relative"
                mt={3}
                gap={2}
                flexWrap={{ base: "wrap", sm: "nowrap" }}
              >
                <Tooltip label="Emoji" hasArrow>
                  <IconButton
                    icon={<HiOutlineEmojiHappy />}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Add emoji"
                    borderRadius="full"
                    flexShrink={0}
                  />
                </Tooltip>

                <Textarea
                  ref={messageInputRef}
                  variant="filled"
                  bg="#F3F0E9"
                  placeholder="Type a message. Enter sends, Shift+Enter adds a new line."
                  value={newMessage}
                  onChange={typingHandler}
                  flex="1"
                  minW={0}
                  resize="none"
                  overflowY="auto"
                  rows={1}
                  borderRadius="2xl"
                  onKeyDown={handleComposerKeyDown}
                  fontSize={{ base: "16px", md: "md" }}
                />

                <Button
                  colorScheme="orange"
                  onClick={() => handleSendMessage()}
                  isDisabled={!newMessage.trim() || sendingMessageIds.length > 0}
                  borderRadius="full"
                  flexShrink={0}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Send
                </Button>

                {showEmojiPicker ? (
                  <Box
                    position="absolute"
                    bottom={{ base: "76px", sm: "58px" }}
                    left="0"
                    zIndex={1000}
                    maxW="calc(100vw - 64px)"
                  >
                    <Picker onEmojiClick={onEmojiClick} />
                  </Box>
                ) : null}
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%" px={6}>
          <Box
            textAlign="center"
            maxW="460px"
            px={{ base: 6, md: 10 }}
            py={{ base: 8, md: 10 }}
            borderRadius="3xl"
            bg="linear-gradient(180deg, rgba(255,255,255,0.94), rgba(239,246,255,0.82))"
            borderWidth="1px"
            borderColor="blue.100"
            boxShadow="0 24px 60px rgba(59, 130, 246, 0.10)"
          >
            <Circle
              size={{ base: "72px", md: "88px" }}
              mx="auto"
              mb={5}
              bg="orange.50"
              borderWidth="1px"
              borderColor="orange.100"
            >
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontFamily="Work Sans"
                fontWeight="700"
                color="orange.400"
              >
                TS
              </Text>
            </Circle>
            <Text
              fontSize={{ base: "lg", md: "2xl" }}
              pb={3}
              fontFamily="Work sans"
              textAlign="center"
              fontWeight="700"
              color="gray.800"
            >
              Pick a chat to jump back in, or start something new.
            </Text>
            <Text fontSize="sm" color="gray.500" mb={6}>
              Your messages, typing updates, and group conversations will appear here.
            </Text>
            <Button
              colorScheme="orange"
              borderRadius="full"
              px={8}
              onClick={() => openSearchDrawer(true)}
            >
              Start a New Conversation
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
