import { CloseIcon } from "@chakra-ui/icons";
import { Badge, Box, Text, HStack, Tooltip } from "@chakra-ui/react";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  const isAdmin = admin?._id === user?._id;

  return (
    <Tooltip label={`Remove ${user.name}`} hasArrow placement="top">
      <Badge
        px={3}
        py={1.5}
        m={1}
        borderRadius="full"
        variant="solid"
        fontSize="13px"
        colorScheme={isAdmin ? "orange" : "purple"}
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        gap={2}
        maxW="100%"
        _hover={{ opacity: 0.8, transform: "scale(1.05)" }}
        transition="all 0.15s ease-in-out"
      >
        <HStack spacing={1} maxW="100%" minW={0}>
          <Text fontWeight="medium" noOfLines={1}>
            {user.name}
            {isAdmin && (
              <Text as="span" fontWeight="bold">
                {" "}
                (Admin)
              </Text>
            )}
          </Text>

          <Box as="button" type="button" onClick={handleFunction} flexShrink={0}>
            <CloseIcon fontSize="10px" />
          </Box>
        </HStack>
      </Badge>
    </Tooltip>
  );
};

export default UserBadgeItem;
