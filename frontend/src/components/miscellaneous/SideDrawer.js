import React, { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UserAvatar/UserListItem";
import { getSender } from "../../config/ChatLogics";
import { apiClient, getAuthConfig } from "../../config/apiClient";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const { user, setSelectedChat, chats = [], setChats, notification, setNotification } =
    ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isProfileOpen,
    onOpen: openProfile,
    onClose: closeProfile,
  } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const sortedNotifications = useMemo(
    () => [...notification].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [notification]
  );

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResult([]);
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
      const { data } = await apiClient.get(
        `/api/user?search=${encodeURIComponent(search.trim())}`,
        getAuthConfig(user?.token)
      );
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

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const { data } = await apiClient.post(
        "/api/chat",
        { userId },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );

      setChats((prevChats) => {
        if (prevChats?.some((chat) => chat._id === data._id)) {
          return prevChats;
        }

        return [data, ...(prevChats || [])];
      });
      setSelectedChat(data);
      onClose();
    } catch (error) {
      toast({
        title: "Error fetching chat",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoadingChat(false);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        position="relative"
        zIndex={30}
        bg="whiteAlpha.920"
        w="100%"
        p="10px 16px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        backdropFilter="blur(18px)"
        boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
      >
        <Tooltip label="Search users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            leftIcon={<SearchIcon />}
            onClick={onOpen}
            borderRadius="full"
          >
            <Text display={{ base: "none", md: "flex" }}>Search User</Text>
          </Button>
        </Tooltip>

        <Text
          fontSize={{ base: "lg", md: "2xl" }}
          fontFamily="Work Sans"
          fontWeight="700"
          letterSpacing="0.04em"
          color="gray.800"
        >
          Talk-Space
        </Text>

        <Box display="flex" alignItems="center" gap={3}>
          <Menu>
            <MenuButton p={1} position="relative" borderRadius="full">
              <BellIcon fontSize="2xl" m={1} color="gray.700" />
              {notification.length > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  bg="orange.400"
                  color="white"
                  borderRadius="full"
                  px={2}
                  fontSize="0.7em"
                >
                  {notification.length}
                </Badge>
              )}
            </MenuButton>
            <Portal>
              <MenuList
                bg="white"
                color="black"
                zIndex={40}
                borderRadius="2xl"
                boxShadow="0 24px 60px rgba(15, 23, 42, 0.16)"
              >
                {!notification.length && <Text p={3}>No new messages right now.</Text>}
                {sortedNotifications.map((notif) => (
                  <MenuItem
                    key={notif._id}
                    onClick={() => {
                      setSelectedChat(notif.chat);
                      setNotification((prev) => prev.filter((item) => item._id !== notif._id));
                    }}
                  >
                    {notif.chat.isGroupChat
                      ? `New message in ${notif.chat.chatName}`
                      : `New message from ${getSender(user, notif.chat.users)}`}
                  </MenuItem>
                ))}
              </MenuList>
            </Portal>
          </Menu>

          <Menu>
            <MenuButton as={Button} bg="white" rightIcon={<ChevronDownIcon />} borderRadius="full">
              <Avatar size="sm" cursor="pointer" name={user?.name} src={user?.pic} />
            </MenuButton>
            <Portal>
              <MenuList
                bg="white"
                color="black"
                zIndex={40}
                borderRadius="2xl"
                boxShadow="0 24px 60px rgba(15, 23, 42, 0.16)"
              >
                <MenuItem onClick={openProfile}>My Profile</MenuItem>
                <MenuDivider />
                <MenuItem onClick={logoutHandler}>Logout</MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      </Box>

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
              <Button colorScheme="orange" onClick={handleSearch}>
                Go
              </Button>
            </Box>

            {loading ? <ChatLoading /> : null}

            {!loading && search.trim() && !searchResult.length ? (
              <Box
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.100"
                borderRadius="xl"
                p={4}
                mb={4}
              >
                <Text fontWeight="600" color="gray.700">
                  No users matched that search.
                </Text>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Try a different name or email.
                </Text>
              </Box>
            ) : null}

            {!loading &&
              searchResult.map((searchUser) => (
                <Box
                  key={searchUser._id}
                  onClick={() => accessChat(searchUser._id)}
                  cursor="pointer"
                  bg="white"
                  color="black"
                  _hover={{ bg: "gray.100" }}
                  borderRadius="md"
                  p={2}
                  mb={2}
                >
                  <UserListItem user={searchUser} />
                </Box>
              ))}

            {loadingChat && <Spinner ml="auto" display="flex" color="orange.400" />}

            {!loading && !search.trim() && !searchResult.length ? (
              <Text fontSize="sm" color="gray.500" mt={4}>
                Search to start a new conversation. You already have {chats.length} chats.
              </Text>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={closeProfile}
        hideTrigger
      />
    </>
  );
};

export default SideDrawer;
