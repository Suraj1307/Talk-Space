import { CloseIcon } from "@chakra-ui/icons";
import { Badge, Box, Text, HStack, Tooltip } from "@chakra-ui/react";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  return (
    <Tooltip label={`Remove ${user.name}`} hasArrow placement="top">
      <Badge
        px={3}
        py={1.5}
        m={1}
        borderRadius="full"
        variant="solid"
        fontSize="13px"
        colorScheme={admin === user._id ? "orange" : "purple"}
        cursor="pointer"
        display="flex"
        alignItems="center"
        gap={2}
        _hover={{ opacity: 0.8, transform: "scale(1.05)" }}
        transition="all 0.15s ease-in-out"
      >
        <HStack spacing={1}>
          <Text fontWeight="medium">
            {user.name}
            {admin === user._id && (
              <Text as="span" fontWeight="bold">
                {" "}
                (Admin)
              </Text>
            )}
          </Text>

          <Box as="span" onClick={handleFunction}>
            <CloseIcon fontSize="10px" />
          </Box>
        </HStack>
      </Badge>
    </Tooltip>
  );
};

export default UserBadgeItem;
