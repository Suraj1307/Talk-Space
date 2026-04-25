import ScrollableFeed from "react-scrollable-feed";
import { Avatar, Box, Button, HStack, Text, Tooltip, VStack } from "@chakra-ui/react";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

const getMessageStatus = (message, userId, chatUsersLength) => {
  if (message.sender._id !== userId) return "";

  const deliveredCount = (message.deliveredTo || []).filter((id) => id !== userId).length;
  const readCount = (message.readBy || []).filter((id) => id !== userId).length;
  const otherUserCount = Math.max((chatUsersLength || 1) - 1, 1);

  if (message.localStatus === "failed") return "Failed";
  if (message.localStatus === "sending") return "Sending...";
  if (readCount >= otherUserCount) return "Seen";
  if (deliveredCount >= otherUserCount) return "Delivered";
  return "Sent";
};

const ScrollableChat = ({ messages, selectedChat, onRetryMessage }) => {
  const { user, onlineUsers = {} } = ChatState();

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => {
          const isOwn = m.sender._id === user._id;
          const otherParticipant = !selectedChat?.isGroupChat
            ? selectedChat?.users?.find((chatUser) => chatUser._id === m.sender._id)
            : null;
          const isOnline = Boolean(onlineUsers[m.sender._id]?.isOnline);

          return (
            <Box style={{ display: "flex" }} key={m._id || m.clientId}>
              {(isSameSender(messages, m, i, user._id) || isLastMessage(messages, i, user._id)) && (
                <Tooltip
                  label={
                    otherParticipant && !selectedChat?.isGroupChat
                      ? `${m.sender.name} ${isOnline ? "is online" : "was last active recently"}`
                      : m.sender.name
                  }
                  placement="bottom-start"
                  hasArrow
                >
                  <Box position="relative" mt="7px" mr={1}>
                    <Avatar size="sm" cursor="pointer" name={m.sender.name} src={m.sender.pic} />
                    {!isOwn && !selectedChat?.isGroupChat ? (
                      <Box
                        position="absolute"
                        right="0"
                        bottom="0"
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        bg={isOnline ? "green.400" : "gray.300"}
                        border="2px solid white"
                      />
                    ) : null}
                  </Box>
                </Tooltip>
              )}
              <VStack
                align={isOwn ? "flex-end" : "flex-start"}
                spacing={1}
                ml={isSameSenderMargin(messages, m, i, user._id)}
                mt={isSameUser(messages, m, i, user._id) ? 1 : 3}
                maxW="75%"
              >
                <Box
                  bg={isOwn ? "#DBEAFE" : "#FCE7F3"}
                  borderRadius="20px"
                  px={4}
                  py={2}
                  overflowWrap="anywhere"
                  wordBreak="break-word"
                  borderWidth="1px"
                  borderColor={m.localStatus === "failed" ? "red.200" : "transparent"}
                >
                  {m.content}
                </Box>
                <HStack spacing={2} px={1}>
                  <Text fontSize="xs" color="gray.500">
                    {formatTime(m.createdAt)}
                  </Text>
                  {isOwn ? (
                    <Text fontSize="xs" color={m.localStatus === "failed" ? "red.500" : "gray.500"}>
                      {getMessageStatus(m, user._id, selectedChat?.users?.length)}
                    </Text>
                  ) : null}
                  {m.localStatus === "failed" ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => onRetryMessage?.(m)}
                    >
                      Retry
                    </Button>
                  ) : null}
                </HStack>
              </VStack>
            </Box>
          );
        })}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
