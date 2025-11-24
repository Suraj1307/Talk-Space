import { AddIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Tooltip, Button } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { ChatState } from "../Context/ChatProvider";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  const toast = useToast();

  // Fetch chats from backend
  const fetchChats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      {/* Header */}
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
            colorScheme="teal"
            size="sm"
          >
            New Group
          </Button>
        </GroupChatModal>
      </Box>

      {/* Chat List */}
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="auto"
        sx={{
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { bg: "gray.300", borderRadius: "24px" },
        }}
      >
        {!chats ? (
          <ChatLoading />
        ) : (
          <Stack spacing={3}>
            {chats.map((chat) => {
              // Safe chat name
              const chatName = !chat.isGroupChat
                ? getSender(loggedUser, chat.users || [])
                : chat.chatName || "Unnamed Chat";

              return (
                <Tooltip
                  label={chatName}
                  placement="bottom-start"
                  hasArrow
                  key={chat._id}
                >
                  <Box
                    onClick={() => setSelectedChat(chat)}
                    cursor="pointer"
                    bg={selectedChat === chat ? "teal.400" : "gray.100"}
                    color={selectedChat === chat ? "white" : "black"}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    _hover={{
                      bg: selectedChat === chat ? "teal.500" : "gray.200",
                    }}
                    display="flex"
                    flexDir="column"
                  >
                    {/* Chat Name */}
                    <Text fontWeight="bold">{chatName}</Text>

                    {/* Last Message */}
                    {chat.latestMessage && (
                      <Text fontSize="sm" noOfLines={1}>
                        <b>{chat.latestMessage?.sender?.name || "Unknown"}: </b>
                        {chat.latestMessage?.content || ""}
                      </Text>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
