import { Box } from "@chakra-ui/react";
import "./styles.css";
import SingleChat from "./SingleChat";
import { ChatState } from "../Context/ChatProvider";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="stretch"
      flexDir="column"
      p={3}
      bg="whiteAlpha.880"
      w={{ base: "100%", md: "68%" }}
      h="100%"
      minW={0}
      minH={0}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      backdropFilter="blur(18px)"
      boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default ChatBox;
