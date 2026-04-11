import { ViewIcon } from "@chakra-ui/icons";
import {
  Portal,
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

const ProfileModal = ({
  user,
  children,
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  hideTrigger = false,
}) => {
  const disclosure = useDisclosure();
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : disclosure.isOpen;
  const onOpen = controlledOnOpen || disclosure.onOpen;
  const onClose = controlledOnClose || disclosure.onClose;

  return (
    <>
      {!hideTrigger &&
        (children ? (
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
        ))}

      <Portal>
        <Modal
          size={{ base: "xs", sm: "md", md: "lg" }}
          isOpen={isOpen}
          onClose={onClose}
          isCentered
          motionPreset="slideInBottom"
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <ModalContent
            mx={4}
            my={{ base: 6, md: 10 }}
            maxW={{ base: "calc(100vw - 32px)", sm: "28rem", md: "34rem" }}
            borderRadius="3xl"
            boxShadow="0 30px 80px rgba(15, 23, 42, 0.24)"
            borderWidth="1px"
            borderColor="whiteAlpha.500"
            bg="rgba(255, 255, 255, 0.96)"
            textAlign="center"
            fontFamily="Work sans"
            overflow="hidden"
          >
            <ModalHeader
              pt={8}
              pb={3}
              px={{ base: 5, md: 8 }}
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="bold"
            >
              {user?.name}
            </ModalHeader>

            <ModalBody px={{ base: 5, md: 8 }} pb={4}>
              <VStack spacing={5}>
                <Image
                  borderRadius="full"
                  boxSize={{ base: "104px", md: "148px" }}
                  src={user?.pic}
                  alt={user?.name}
                  objectFit="cover"
                  shadow="xl"
                  borderWidth="4px"
                  borderColor="orange.100"
                />
                <Box
                  w="100%"
                  borderRadius="2xl"
                  bg="orange.50"
                  borderWidth="1px"
                  borderColor="orange.100"
                  px={{ base: 4, md: 5 }}
                  py={4}
                >
                  <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.12em"
                    fontWeight="700"
                    color="orange.500"
                    mb={2}
                  >
                    Email
                  </Text>
                  <Text fontSize={{ base: "md", md: "lg" }} color="gray.700" wordBreak="break-word">
                    {user?.email}
                  </Text>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter justifyContent="center" px={{ base: 5, md: 8 }} pb={8} pt={2}>
              <Button colorScheme="orange" onClick={onClose} px={8} borderRadius="full">
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Portal>
    </>
  );
};

export default ProfileModal;
