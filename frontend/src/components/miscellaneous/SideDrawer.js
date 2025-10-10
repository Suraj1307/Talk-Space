import React, { useState } from "react";
import {
  Box,
  Tooltip,
  Button,
  Text,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  Avatar,
  MenuItem,
  MenuDivider,
  Drawer,
  useDisclosure,
  DrawerOverlay,
  DrawerHeader,
  DrawerContent,
  DrawerBody,
  Input,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UserAvatar/UserListItem";
import { getSender } from "../../config/ChatLogics";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const { user, setSelectedChat, chats, setChats, notification, setNotification } =
    ChatState();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate(); 
  const toast = useToast();

  // Search Users
  const handleSearch = async () => {
    if (!search.trim()) {
      return toast({
        title: "Please enter a name or email",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-left",
      });
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || "Failed to load results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  // Access Chat
  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching chat",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoadingChat(false);
    }
  };

  // Logout
  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/"); // <-- replaced history.push
  };

  return (
    <>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="8px 15px"
        borderWidth="2px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        {/* Search Button */}
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button variant="ghost" onClick={onOpen}>
            <i className="fas fa-search" />
            <Text display={{ base: "none", md: "flex" }} px={4}>
              Search User
            </Text>
          </Button>
        </Tooltip>

        {/* App Title */}
        <Text fontSize="2xl" fontFamily="Work sans" fontWeight="bold" color="black">
          Talk-Space
        </Text>

        {/* Notifications & Profile */}
        <Box display="flex" alignItems="center" gap={3}>
          {/* Notifications */}
          <Menu>
            <MenuButton p={1} position="relative">
              <BellIcon fontSize="2xl" m={1} color="black" />
              {notification.length > 0 && (
                <Badge
                  position="absolute"
                  top="0"
                  right="0"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  px={2}
                  fontSize="0.7em"
                >
                  {notification.length}
                </Badge>
              )}
            </MenuButton>
            <MenuList bg="white" color="black">
              {!notification.length && <Text p={2}>No new messages</Text>}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification((prev) => prev.filter((n) => n !== notif));
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Profile */}
          <Menu>
            <MenuButton as={Button} bg="white" rightIcon={<ChevronDownIcon />}>
              <Avatar size="sm" cursor="pointer" name={user.name} src={user.pic} />
            </MenuButton>
            <MenuList bg="white" color="black">
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen} size="sm">
        <DrawerOverlay />
        <DrawerContent bg="white" color="black">
          <DrawerHeader borderBottomWidth="1px" fontWeight="bold">
            Search Users
          </DrawerHeader>
          <DrawerBody>
            <Box display="flex" gap={2} mb={4}>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                bg="white"
                color="black"
                borderColor="gray.300"
              />
              <Button colorScheme="blue" onClick={handleSearch}>
                Go
              </Button>
            </Box>

            {loading ? (
              <ChatLoading />
            ) : (
              searchResult.map((user) => (
                <Box
                  key={user._id}
                  onClick={() => accessChat(user._id)}
                  cursor="pointer"
                  bg="white"
                  color="black"
                  _hover={{ bg: "gray.100" }}
                  borderRadius="md"
                  p={2}
                  mb={2}
                >
                  <UserListItem user={user} />
                </Box>
              ))
            )}

            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
