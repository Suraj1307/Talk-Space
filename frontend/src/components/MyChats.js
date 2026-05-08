import { AddIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Circle,
  Button,
  Badge,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { getSender } from "../config/ChatLogics";
import { apiClient, getAuthConfig } from "../config/apiClient";
import { getStoredUserInfo } from "../config/storage";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [chatToRemove, setChatToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const fetchErrorToastId = "my-chats-fetch-error";
  const hasLoadedChatsRef = useRef(false);
  const chatsRef = useRef([]);
  const { selectedChat, setSelectedChat, user, chats, setChats, notification = [], setNotification } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const shouldRetryChatFetch = (error) => {
    if (!error.response) return true;

    return [408, 425, 429, 500, 502, 503, 504].includes(error.response.status);
  };

  const waitBeforeRetry = (attempt) =>
    new Promise((resolve) => {
      setTimeout(resolve, attempt * 700);
    });

  useEffect(() => {
    chatsRef.current = chats || [];
  }, [chats]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const { data } = await apiClient.get("/api/chat", getAuthConfig(user.token));
        setChats(data);
        hasLoadedChatsRef.current = true;
        if (toast.isActive(fetchErrorToastId)) {
          toast.close(fetchErrorToastId);
        }
        return;
      } catch (error) {
        const shouldRetry = attempt < 3 && shouldRetryChatFetch(error);

        if (shouldRetry) {
          await waitBeforeRetry(attempt);
          continue;
        }

        const hasExistingChats =
          hasLoadedChatsRef.current || (chatsRef.current || []).length > 0;

        if (hasExistingChats) {
          return;
        }

        toast({
          id: fetchErrorToastId,
          title: "Error Occurred!",
          description:
            error.response?.data?.message ||
            "Failed to load the chats",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-left",
        });
        return;
      }
    }
  }, [setChats, toast, user]);

  useEffect(() => {
    setLoggedUser(getStoredUserInfo());
    fetchChats();
  }, [fetchAgain, fetchChats]);

  const handleRemoveChat = async () => {
    if (!chatToRemove) return;
    try {
      setRemoveLoading(true);
      await apiClient.put(
        "/api/chat/remove-user-chat",
        { chatId: chatToRemove._id },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );

      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatToRemove._id));

      if (selectedChat && selectedChat._id === chatToRemove._id) {
        setSelectedChat(null);
      }

      onClose();
      setChatToRemove(null);

      toast({
        title: "Chat removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to remove chat",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="whiteAlpha.880"
      backdropFilter="blur(18px)"
      w={{ base: "100%", md: "31%" }}
      h="100%"
      minW={0}
      minH={0}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "20px", md: "28px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "14px", md: "16px" }}
            rightIcon={<AddIcon />}
            colorScheme="orange"
            size="sm"
            borderRadius="full"
            w={{ base: "100%", sm: "auto" }}
          >
            New Group
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="rgba(255,255,255,0.65)"
        w="100%"
        h="100%"
        minH={0}
        borderRadius="xl"
        overflowY="auto"
        sx={{
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { bg: "gray.300", borderRadius: "24px" },
        }}
      >
        {!chats ? (
          <ChatLoading />
        ) : !chats.length ? (
          <Box
            textAlign="center"
            px={4}
            py={8}
            borderRadius="xl"
            bg="orange.50"
            borderWidth="1px"
            borderColor="orange.100"
          >
            <Text fontWeight="700" color="gray.700">
              No chats yet
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Search for someone or create a group to start talking.
            </Text>
          </Box>
        ) : (
          <Stack spacing={3}>
            {chats.map((chat) => {
              const chatName = !chat.isGroupChat
                ? getSender(loggedUser, chat.users || [])
                : chat.chatName || "Unnamed Chat";
              const chatAvatar = !chat.isGroupChat
                ? (chat.users || []).find((chatUser) => chatUser._id !== loggedUser?._id)?.pic
                : undefined;
              const isActive = selectedChat?._id === chat._id;
              const unreadCount = notification.filter((item) => item.chat?._id === chat._id).length;
              const timestamp = chat.latestMessage?.createdAt || chat.updatedAt;

              return (
                <Tooltip label={chatName} placement="bottom-start" hasArrow key={chat._id}>
                  <Box
                    onClick={() => {
                      setSelectedChat(chat);
                      setNotification((prev) =>
                        prev.filter((item) => item.chat?._id !== chat._id)
                      );
                    }}
                    cursor="pointer"
                    bg={isActive ? "orange.50" : "whiteAlpha.950"}
                    color="black"
                    px={3}
                    py={3}
                    borderRadius="xl"
                    _hover={{
                      bg: isActive ? "orange.100" : "rgba(239,246,255,0.92)",
                    }}
                    display="flex"
                    flexDir="column"
                    gap={2}
                    role="group"
                    transition="all 0.2s ease"
                    borderWidth={isActive ? "2px" : "1px"}
                    borderColor={isActive ? "orange.400" : "blackAlpha.100"}
                    boxShadow={isActive ? "0 14px 34px rgba(251, 146, 60, 0.18)" : "none"}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems={{ base: "flex-start", sm: "center" }}
                      gap={3}
                      flexWrap={{ base: "wrap", sm: "nowrap" }}
                    >
                      <Box minW={0} display="flex" alignItems="center" gap={3} flex="1">
                        <Avatar
                          size="sm"
                          name={chatName}
                          src={chatAvatar}
                          bg={chat.isGroupChat ? "blue.100" : undefined}
                          color={chat.isGroupChat ? "blue.700" : undefined}
                          flexShrink={0}
                        />
                        <Box minW={0} display="flex" alignItems="center" gap={2}>
                        <Text fontWeight="bold" noOfLines={1}>
                          {chatName}
                        </Text>
                        {chat.isGroupChat ? (
                          <Badge colorScheme="blue" borderRadius="full" px={2}>
                            Group
                          </Badge>
                        ) : null}
                        {unreadCount > 0 ? (
                          unreadCount === 1 ? (
                            <Circle size="9px" bg="red.400" flexShrink={0} />
                          ) : (
                            <Circle size="20px" bg="red.400" color="white" fontSize="xs" fontWeight="700" flexShrink={0}>
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Circle>
                          )
                        ) : null}
                        </Box>
                      </Box>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        flexShrink={0}
                        w={{ base: "100%", sm: "auto" }}
                        justifyContent={{ base: "space-between", sm: "flex-end" }}
                      >
                        {timestamp ? (
                          <Text fontSize="xs" color="gray.500" fontWeight="600">
                            {formatRelativeTime(timestamp)}
                          </Text>
                        ) : null}
                      <Button
                        size="xs"
                        colorScheme="red"
                        opacity={{ base: 1, md: 0 }}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.2s ease-in-out"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToRemove({ _id: chat._id, name: chatName });
                          onOpen();
                        }}
                      >
                        Remove
                      </Button>
                      </Box>
                    </Box>

                    {chat.latestMessage ? (
                      <Text fontSize="sm" noOfLines={1} color="gray.700">
                        <b>{chat.latestMessage?.sender?.name || "Unknown"}: </b>
                        {chat.latestMessage?.content || ""}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No messages yet. Open the chat to say hello.
                      </Text>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </Box>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (removeLoading) return;
          setChatToRemove(null);
          onClose();
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="Work sans">Remove Chat</ModalHeader>
          <ModalCloseButton disabled={removeLoading} />
          <ModalBody>
            <Text color="gray.700">
              Remove <b>{chatToRemove?.name}</b> from your chat list?
            </Text>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="ghost"
              onClick={() => {
                setChatToRemove(null);
                onClose();
              }}
              isDisabled={removeLoading}
            >
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleRemoveChat} isLoading={removeLoading}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MyChats;
