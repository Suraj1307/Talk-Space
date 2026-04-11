import { AddIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
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
import { useCallback, useEffect, useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import { getSender } from "../config/ChatLogics";
import { apiClient, getAuthConfig } from "../config/apiClient";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [chatToRemove, setChatToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;

    try {
      const { data } = await apiClient.get("/api/chat", getAuthConfig(user.token));
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || "Failed to load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  }, [setChats, toast, user]);

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
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
        fontSize={{ base: "24px", md: "28px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
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

              return (
                <Tooltip label={chatName} placement="bottom-start" hasArrow key={chat._id}>
                  <Box
                    onClick={() => setSelectedChat(chat)}
                    cursor="pointer"
                    bg={selectedChat === chat ? "orange.400" : "white"}
                    color={selectedChat === chat ? "white" : "black"}
                    px={3}
                    py={3}
                    borderRadius="xl"
                    _hover={{
                      bg: selectedChat === chat ? "orange.500" : "orange.50",
                    }}
                    display="flex"
                    flexDir="column"
                    gap={2}
                    role="group"
                    transition="all 0.2s ease"
                    borderWidth="1px"
                    borderColor={selectedChat === chat ? "orange.300" : "blackAlpha.100"}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={3}>
                      <Text fontWeight="bold" noOfLines={1}>
                        {chatName}
                      </Text>
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

                    {chat.latestMessage ? (
                      <Text fontSize="sm" noOfLines={1}>
                        <b>{chat.latestMessage?.sender?.name || "Unknown"}: </b>
                        {chat.latestMessage?.content || ""}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color={selectedChat === chat ? "whiteAlpha.900" : "gray.500"}>
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
