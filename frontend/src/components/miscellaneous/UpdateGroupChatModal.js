import { ViewIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import { apiClient, getAuthConfig } from "../../config/apiClient";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import UserListItem from "../UserAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user } = ChatState();
  const isAdmin = useMemo(
    () => selectedChat?.groupAdmin?._id === user?._id,
    [selectedChat, user]
  );

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim() || !isAdmin) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.get(
        `/api/user?search=${encodeURIComponent(query.trim())}`,
        getAuthConfig(user?.token)
      );
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || "Failed to load search results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!groupChatName.trim() || !isAdmin) return;

    try {
      setRenameLoading(true);
      const { data } = await apiClient.put(
        "/api/chat/rename",
        { chatId: selectedChat._id, chatName: groupChatName.trim() },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
      setGroupChatName("");
      toast({
        title: "Group name updated",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleAddUser = async (userToAdd) => {
    if (!isAdmin) return;

    if (selectedChat.users.find((chatUser) => chatUser._id === userToAdd._id)) {
      toast({
        title: "User already in group",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.put(
        "/api/chat/groupadd",
        { chatId: selectedChat._id, userId: userToAdd._id },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
      toast({
        title: "Member added",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userToRemove) => {
    const isSelf = userToRemove._id === user._id;
    if (!isAdmin && !isSelf) return;

    const confirmed = window.confirm(
      isSelf
        ? "Leave this group chat?"
        : `Remove ${userToRemove.name} from this group?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const { data } = await apiClient.put(
        "/api/chat/groupremove",
        { chatId: selectedChat._id, userId: userToRemove._id },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );

      if (isSelf) {
        setSelectedChat(null);
      } else {
        setSelectedChat(data);
      }

      setFetchAgain((prev) => !prev);
      fetchMessages();
      toast({
        title: isSelf ? "You left the group" : "Member removed",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        display={{ base: "flex" }}
        icon={<ViewIcon />}
        onClick={onOpen}
        aria-label="Manage group chat"
      />

      <Modal onClose={onClose} isOpen={isOpen} isCentered size="lg">
        <ModalOverlay />
        <ModalContent bg="white" color="black">
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            {selectedChat?.chatName}
          </ModalHeader>

          <ModalCloseButton color="black" />

          <ModalBody display="flex" flexDir="column" alignItems="center" gap={3}>
            {!isAdmin ? (
              <Box
                w="100%"
                p={3}
                borderRadius="lg"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.100"
              >
                <Text fontWeight="600" color="gray.700">
                  Only group admins can rename the chat or add/remove other members.
                </Text>
              </Box>
            ) : null}

            <Box
              w="100%"
              maxH="100px"
              overflowY="auto"
              display="flex"
              flexWrap="wrap"
              pb={3}
            >
              {selectedChat?.users.map((chatUser) => (
                <UserBadgeItem
                  key={chatUser._id}
                  user={chatUser}
                  admin={selectedChat.groupAdmin}
                  handleFunction={() => handleRemove(chatUser)}
                  color="black"
                />
              ))}
            </Box>

            <FormControl display="flex" w="100%">
              <Input
                placeholder={isAdmin ? "Rename group" : "Only admins can rename"}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                bg="gray.100"
                color="black"
                _placeholder={{ color: "gray.500" }}
                isDisabled={!isAdmin}
              />
              <Button
                variant="solid"
                colorScheme="orange"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
                isDisabled={!isAdmin || !groupChatName.trim()}
              >
                Update
              </Button>
            </FormControl>

            <FormControl w="100%">
              <Input
                placeholder={isAdmin ? "Add user to group" : "Only admins can add members"}
                mb={1}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                bg="gray.100"
                color="black"
                _placeholder={{ color: "gray.500" }}
                isDisabled={!isAdmin}
              />
            </FormControl>

            <Box w="100%" maxH="200px" overflowY="auto">
              {loading ? <Spinner size="lg" /> : null}

              {!loading && isAdmin && search.trim() && !searchResult.length ? (
                <Text fontSize="sm" color="gray.500">
                  No users found for that search.
                </Text>
              ) : null}

              {!loading &&
                isAdmin &&
                searchResult?.map((searchUser) => (
                  <UserListItem
                    key={searchUser._id}
                    user={searchUser}
                    handleFunction={() => handleAddUser(searchUser)}
                    color="black"
                  />
                ))}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" onClick={() => handleRemove(user)}>
              Leave Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
