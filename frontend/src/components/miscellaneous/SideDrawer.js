import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Circle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
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
import { HiOutlineStatusOnline } from "react-icons/hi";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const searchInputRef = useRef(null);

  const {
    user,
    setUser,
    setSelectedChat,
    chats = [],
    setChats,
    notification,
    setNotification,
    isSearchOpen,
    openSearchDrawer,
    closeSearchDrawer,
    shouldFocusSearch,
    setShouldFocusSearch,
    visibilityStatus,
    updateVisibilityStatus,
  } = ChatState();
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
  const groupedNotifications = useMemo(() => {
    const grouped = new Map();

    sortedNotifications.forEach((notif) => {
      const chatId = notif.chat?._id;
      if (!chatId) return;

      const existing = grouped.get(chatId) || { chat: notif.chat, items: [] };
      existing.items.push(notif);
      grouped.set(chatId, existing);
    });

    return Array.from(grouped.values());
  }, [sortedNotifications]);
  const unreadCount = groupedNotifications.reduce((count, group) => count + group.items.length, 0);

  useEffect(() => {
    if (!isSearchOpen || !shouldFocusSearch) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      setShouldFocusSearch(false);
    }, 160);

    return () => clearTimeout(timer);
  }, [isSearchOpen, setShouldFocusSearch, shouldFocusSearch]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResult([]);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
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
    }, 300);

    return () => clearTimeout(timer);
  }, [search, toast, user?.token]);

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

  const setVisibility = async (nextStatus) => {
    try {
      const { data } = await apiClient.put(
        "/api/user/visibility",
        { visibilityStatus: nextStatus },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );

      updateVisibilityStatus(data.visibilityStatus);
      const nextUser = { ...user, visibilityStatus: data.visibilityStatus, lastSeenAt: data.lastSeenAt };
      setUser(nextUser);
      localStorage.setItem("userInfo", JSON.stringify(nextUser));
      window.dispatchEvent(
        new CustomEvent("talk-space-visibility-updated", { detail: data.visibilityStatus })
      );
    } catch (error) {
      toast({
        title: "Unable to update status",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
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
      closeSearchDrawer();
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
        gap={{ base: 2, md: 3 }}
        position="relative"
        zIndex={30}
        bg="whiteAlpha.920"
        w="100%"
        p={{ base: "8px 10px", md: "10px 16px" }}
        borderWidth="1px"
        borderColor="blackAlpha.100"
        backdropFilter="blur(18px)"
        boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
      >
        <Tooltip label="Search users to chat" hasArrow placement="bottom-end">
          <Button
            variant="ghost"
            leftIcon={<SearchIcon />}
            onClick={() => openSearchDrawer(true)}
            borderRadius="full"
            pl={{ base: 2, md: 4 }}
            pr={{ base: 2, md: 5 }}
            minW={{ base: "44px", md: "auto" }}
            h={{ base: "44px", md: "48px" }}
            color="gray.700"
            _hover={{ bg: "blue.50", color: "blue.600" }}
          >
            <Text display={{ base: "none", md: "flex" }}>Search User</Text>
          </Button>
        </Tooltip>

        <Text
          fontSize={{ base: "md", sm: "lg", md: "2xl" }}
          fontFamily="Work Sans"
          fontWeight="700"
          letterSpacing="0.04em"
          color="gray.800"
          textAlign="center"
          flex="1"
          minW={0}
          noOfLines={1}
        >
          Talk-Space
        </Text>

        <Box display="flex" alignItems="center" gap={{ base: 2, md: 3 }} flexShrink={0}>
          <Menu>
            <MenuButton
              as={Button}
              p={1.5}
              position="relative"
              borderRadius="full"
              bg="whiteAlpha.700"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              _hover={{ bg: "orange.50", color: "orange.500" }}
              _active={{ bg: "orange.100" }}
              minW="auto"
              h={{ base: "44px", md: "56px" }}
              aria-label="Notifications"
            >
              <BellIcon fontSize={{ base: "xl", md: "2xl" }} m={1} color="gray.800" />
              {unreadCount > 0 && (
                <Circle
                  position="absolute"
                  top="-2"
                  right="-2"
                  bg="red.500"
                  color="white"
                  borderRadius="full"
                  minW="22px"
                  h="22px"
                  fontSize="xs"
                  fontWeight="700"
                  borderWidth="2px"
                  borderColor="white"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Circle>
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
                {groupedNotifications.map(({ chat, items }) => (
                  <MenuItem
                    key={chat._id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setNotification((prev) =>
                        prev.filter((item) => item.chat?._id !== chat._id)
                      );
                    }}
                  >
                    {chat.isGroupChat
                      ? `${items.length} new in ${chat.chatName}`
                      : `${items.length} new from ${getSender(user, chat.users)}`}
                  </MenuItem>
                ))}
              </MenuList>
            </Portal>
          </Menu>

          <Menu>
            <MenuButton
              as={Button}
              bg="whiteAlpha.850"
              rightIcon={<ChevronDownIcon color="gray.600" />}
              borderRadius="full"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              _hover={{ bg: "white", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}
              _active={{ bg: "blue.50" }}
              color="gray.800"
              px={{ base: 2, md: 3 }}
              h={{ base: "44px", md: "48px" }}
              minW="auto"
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box position="relative">
                  <Avatar size="sm" cursor="pointer" name={user?.name} src={user?.pic} />
                  <Circle
                    size="10px"
                    bg={visibilityStatus === "online" ? "green.400" : "yellow.400"}
                    position="absolute"
                    bottom="0"
                    right="0"
                    borderWidth="2px"
                    borderColor="white"
                  />
                </Box>
              </Box>
            </MenuButton>
            <Portal>
              <MenuList
                bg="rgba(255,255,255,0.98)"
                color="gray.800"
                zIndex={40}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="blackAlpha.100"
                boxShadow="0 24px 60px rgba(15, 23, 42, 0.16)"
                py={2}
                minW="220px"
                overflow="hidden"
              >
                <MenuItem
                  onClick={openProfile}
                  borderRadius="md"
                  mx={0}
                  px={5}
                  py={3}
                  _hover={{ bg: "blue.50" }}
                  _focus={{ bg: "blue.50" }}
                >
                  My Profile
                </MenuItem>
                <MenuItem
                  icon={
                    <Icon
                      as={HiOutlineStatusOnline}
                      color={visibilityStatus === "online" ? "green.500" : "yellow.500"}
                    />
                  }
                  onClick={() => setVisibility(visibilityStatus === "online" ? "away" : "online")}
                  borderRadius="md"
                  mx={0}
                  px={5}
                  py={3}
                  _hover={{ bg: "orange.50" }}
                  _focus={{ bg: "orange.50" }}
                >
                  Set status: {visibilityStatus === "online" ? "Away" : "Online"}
                </MenuItem>
                <MenuDivider borderColor="blackAlpha.100" my={2} />
                <MenuItem
                  onClick={logoutHandler}
                  borderRadius="md"
                  mx={0}
                  px={5}
                  py={3}
                  _hover={{ bg: "red.50", color: "red.600" }}
                  _focus={{ bg: "red.50", color: "red.600" }}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      </Box>

      <Drawer placement="left" onClose={closeSearchDrawer} isOpen={isSearchOpen} size="sm">
        <DrawerOverlay />
        <DrawerContent bg="white" color="black">
          <DrawerHeader borderBottomWidth="1px" fontWeight="bold">
            Search Users
          </DrawerHeader>
          <DrawerBody>
            <Box display="flex" gap={2} mb={4} flexDir={{ base: "column", sm: "row" }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="blue.400" />
                </InputLeftElement>
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  borderRadius="xl"
                  pl={10}
                />
              </InputGroup>
              <Button colorScheme="orange" onClick={handleSearch} w={{ base: "100%", sm: "auto" }}>
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
