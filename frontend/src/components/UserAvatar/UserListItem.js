import { Avatar, Box, Circle, Text, VStack } from "@chakra-ui/react";

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
      <Box position="relative" flexShrink={0}>
        <Avatar size="md" name={user.name} src={user.pic} cursor="pointer" />
        <Circle
          size="10px"
          bg={user.visibilityStatus === "away" ? "yellow.400" : "green.400"}
          position="absolute"
          bottom="0"
          right="0"
          borderWidth="2px"
          borderColor="white"
        />
      </Box>
      <VStack align="start" spacing={0} flex="1" minW={0}>
        <Text fontWeight="medium" color="black" noOfLines={1} w="100%">
          {user.name}
        </Text>
        <Text fontSize="sm" color="gray.600" noOfLines={1} w="100%">
          <b>Email:</b> {user.email}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {user.visibilityStatus === "away" ? "Away" : "Online"}
        </Text>
      </VStack>
    </Box>
  );
};

export default UserListItem;
