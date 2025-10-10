import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  IconButton,
  Text,
  Image,
  VStack,
  Box,
  Tooltip,
} from "@chakra-ui/react";

const ProfileModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Trigger */}
      {children ? (
        <Box as="span" cursor="pointer" onClick={onOpen}>
          {children}
        </Box>
      ) : (
        <Tooltip label="View Profile" placement="bottom" hasArrow>
          <IconButton
            display={{ base: "flex" }}
            icon={<ViewIcon />}
            onClick={onOpen}
            aria-label="View Profile"
            variant="ghost"
            colorScheme="blue"
          />
        </Tooltip>
      )}

      {/* Profile Modal */}
      <Modal size={{ base: "xs", sm: "md", md: "lg" }} isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          p={6}
          borderRadius="2xl"
          boxShadow="xl"
          textAlign="center"
          fontFamily="Work sans"
        >
          {/* Header */}
          <ModalHeader fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            {user?.name}
          </ModalHeader>

          {/* Body */}
          <ModalBody>
            <VStack spacing={5}>
              <Image
                borderRadius="full"
                boxSize={{ base: "100px", md: "150px" }}
                src={user?.pic}
                alt={user?.name}
                objectFit="cover"
                shadow="md"
              />
              <Text fontSize={{ base: "md", md: "lg" }} color="gray.600">
                <strong>Email:</strong> {user?.email}
              </Text>
            </VStack>
          </ModalBody>

          {/* Single Close Button */}
          <ModalFooter justifyContent="center">
            <Button colorScheme="blue" onClick={onClose} px={8}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
