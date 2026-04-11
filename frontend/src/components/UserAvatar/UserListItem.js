import { Avatar } from "@chakra-ui/avatar";
import { Box, Text, VStack } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="#E8E8E8"
      _hover={{
        background: "#38B2AC",
        color: "white",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      gap={3}
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
      transition="all 0.2s ease"
      overflow="hidden"
    >
      <Avatar size="md" name={user.name} src={user.pic} cursor="pointer" flexShrink={0} />
      <VStack align="start" spacing={0} flex="1" minW={0}>
        <Text fontWeight="medium" color="black" noOfLines={1} w="100%">
          {user.name}
        </Text>
        <Text fontSize="sm" color="gray.600" noOfLines={1} w="100%">
          <b>Email:</b> {user.email}
        </Text>
      </VStack>
    </Box>
  );
};

export default UserListItem;
