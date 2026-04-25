import { Box, HStack, Skeleton, SkeletonCircle, Stack } from "@chakra-ui/react";

const ChatLoading = () => {
  return (
    <Stack>
      {Array.from({ length: 8 }).map((_, index) => (
        <HStack
          key={index}
          spacing={3}
          px={3}
          py={3}
          borderRadius="xl"
          bg="whiteAlpha.800"
          borderWidth="1px"
          borderColor="blackAlpha.50"
        >
          <SkeletonCircle size="10" />
          <Box flex="1">
            <Skeleton height="14px" width="45%" mb={2} />
            <Skeleton height="12px" width="80%" />
          </Box>
        </HStack>
      ))}
    </Stack>
  );
};

export default ChatLoading;
