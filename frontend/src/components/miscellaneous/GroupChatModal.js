import {
  Box,
  Button,
  FormControl,
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
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import { apiClient, getAuthConfig } from "../../config/apiClient";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import UserListItem from "../UserAvatar/UserListItem";

const GroupChatModal = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const toast = useToast();

  const { user, setChats } = ChatState();

  const resetModal = () => {
    setGroupChatName("");
    setSelectedUsers([]);
    setSearch("");
    setSearchResult([]);
  };

  const handleGroup = (userToAdd) => {
    if (selectedUsers.find((selectedUser) => selectedUser._id === userToAdd._id)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers((prevUsers) => [...prevUsers, userToAdd]);
  };

  const handleDelete = (userToDelete) => {
    setSelectedUsers((prevUsers) =>
      prevUsers.filter((selectedUser) => selectedUser._id !== userToDelete._id)
    );
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
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

  const handleSubmit = async () => {
    if (!groupChatName.trim() || selectedUsers.length < 2) {
      toast({
        title: "Add a name and at least two users",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setCreatingGroup(true);
      const { data } = await apiClient.post(
        "/api/chat/group",
        {
          name: groupChatName.trim(),
          users: JSON.stringify(selectedUsers.map((selectedUser) => selectedUser._id)),
        },
        getAuthConfig(user?.token, { "Content-type": "application/json" })
      );

      setChats((prevChats) => [data, ...(prevChats || [])]);
      onClose();
      resetModal();

      toast({
        title: "New group chat created",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Failed to create chat",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal
        onClose={() => {
          onClose();
          resetModal();
        }}
        isOpen={isOpen}
        isCentered
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="rgba(255,255,255,0.98)" color="gray.800">
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            color="gray.800"
          >
            Create Group Chat
          </ModalHeader>

          <ModalCloseButton color="gray.600" />

          <ModalBody display="flex" flexDir="column" alignItems="center" gap={3}>
            <FormControl>
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                bg="gray.50"
                borderColor="blackAlpha.100"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <FormControl>
              <Input
                placeholder="Add users by name or email"
                mb={2}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                bg="gray.50"
                borderColor="blackAlpha.100"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            <Box w="100%" display="flex" flexWrap="wrap" mb={2}>
              {selectedUsers.map((selectedUser) => (
                <UserBadgeItem
                  key={selectedUser._id}
                  user={selectedUser}
                  handleFunction={() => handleDelete(selectedUser)}
                />
              ))}
            </Box>

            <Box w="100%" maxH="200px" overflowY="auto">
              {loading ? <Spinner size="lg" /> : null}

              {!loading && search.trim() && !searchResult.length ? (
                <Text fontSize="sm" color="gray.500">
                  No users found. Try another search.
                </Text>
              ) : null}

              {!loading &&
                searchResult.slice(0, 4).map((searchUser) => (
                  <UserListItem
                    key={searchUser._id}
                    user={searchUser}
                    handleFunction={() => handleGroup(searchUser)}
                  />
                ))}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              onClick={handleSubmit}
              colorScheme="orange"
              isLoading={creatingGroup}
              isDisabled={selectedUsers.length < 2 || !groupChatName.trim()}
              borderRadius="full"
            >
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;
