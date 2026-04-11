import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import {
  Button,
  IconButton,
  Spinner,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowBackIcon, AddIcon } from "@chakra-ui/icons";
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

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const selectedChatRef = useRef();
  const typingTimeoutRef = useRef();

  const toast = useToast();
  const { selectedChat, setSelectedChat, user, setNotification } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  };

  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !user?.token) return;

    try {
      setLoading(true);
      const { data } = await apiClient.get(
        `/api/message/${selectedChat._id}`,
        getAuthConfig(user.token)
      );
      setMessages(data);
      socket?.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response?.data?.message || "Failed to load messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChat, toast, user]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

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

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("socket_error", handleSocketError);

    return () => {
      clearTimeout(typingTimeoutRef.current);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("socket_error", handleSocketError);
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [toast, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessageReceived = (newMessageReceived) => {
      if (
        !selectedChatRef.current ||
        selectedChatRef.current._id !== newMessageReceived.chat._id
      ) {
        setNotification((prevNotification) => {
          if (prevNotification.some((item) => item._id === newMessageReceived._id)) {
            return prevNotification;
          }

          return [newMessageReceived, ...prevNotification];
        });
        setFetchAgain((prev) => !prev);
        return;
      }

      setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
    };

    socket.on("message recieved", handleMessageReceived);

    return () => {
      socket.off("message recieved", handleMessageReceived);
    };
  }, [setFetchAgain, setNotification]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !selectedChat) return;

    socket?.emit("stop typing", selectedChat._id);
    clearTimeout(typingTimeoutRef.current);
    setTyping(false);

    try {
      const { data } = await apiClient.post(
        "/api/message",
        { content: trimmedMessage, chatId: selectedChat._id },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );
      setNewMessage("");
      setShowEmojiPicker(false);
      socket?.emit("new message", data);
      setMessages((prevMessages) => [...prevMessages, data]);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response?.data?.message || "Failed to send the message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
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
  };

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
            <Box display="flex" alignItems="center" gap={3} minW={0} flex="1">
              <IconButton
                display={{ base: "flex", md: "none" }}
                icon={<ArrowBackIcon />}
                aria-label="Back to chats"
                onClick={() => setSelectedChat(null)}
                flexShrink={0}
              />
              <Text
                fontSize={{ base: "24px", md: "30px" }}
                fontFamily="Work sans"
                fontWeight="700"
                minW={0}
                wordBreak="break-word"
              >
                {!selectedChat.isGroupChat
                  ? getSender(user, selectedChat.users)
                  : selectedChat.chatName.toUpperCase()}
              </Text>
            </Box>

            <Box display="flex" alignItems="center" gap={2} flexShrink={0}>
              {!selectedChat.isGroupChat ? (
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
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
              <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" color="orange.400" />
            ) : messages.length ? (
              <div className="messages">
                <ScrollableChat messages={messages} />
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

            <FormControl id="message-input" isRequired mt={3}>
              {isTyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : null}

              <Box
                display="flex"
                alignItems="center"
                position="relative"
                mt={3}
                gap={2}
                flexWrap={{ base: "wrap", sm: "nowrap" }}
              >
                <Tooltip label="Emoji" hasArrow>
                  <IconButton
                    icon={<AddIcon />}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Add emoji"
                    flexShrink={0}
                  />
                </Tooltip>

                <Input
                  variant="filled"
                  bg="#F3F0E9"
                  placeholder="Enter a message.."
                  value={newMessage}
                  onChange={typingHandler}
                  flex="1"
                  minW={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />

                <Button
                  colorScheme="orange"
                  onClick={handleSendMessage}
                  isDisabled={!newMessage.trim()}
                  borderRadius="full"
                  flexShrink={0}
                >
                  Send
                </Button>

                {showEmojiPicker ? (
                  <Box
                    position="absolute"
                    bottom={{ base: "58px", sm: "50px" }}
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
          <Text fontSize={{ base: "xl", md: "3xl" }} pb={3} fontFamily="Work sans" textAlign="center">
            Choose a chat to read messages, see live typing, and start the conversation.
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
