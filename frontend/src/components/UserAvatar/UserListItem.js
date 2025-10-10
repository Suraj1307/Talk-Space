import { Avatar } from "@chakra-ui/avatar";
import { Box, Text, VStack } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="#E8E8E8"         // Light background
      _hover={{
        background: "#38B2AC", // Hover color
        color: "white",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
      transition="all 0.2s ease"
    >
      <Avatar
        mr={3}
        size="md"
        name={user.name}
        src={user.pic}
        cursor="pointer"
      />
      <VStack align="start" spacing={0}>
        <Text fontWeight="medium" color="black">{user.name}</Text>
        <Text fontSize="sm" color="gray.600">
          <b>Email:</b> {user.email}
        </Text>
      </VStack>
    </Box>
  );
};

export default UserListItem;
