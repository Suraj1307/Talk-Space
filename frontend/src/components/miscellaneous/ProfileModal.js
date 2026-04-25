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
  Badge,
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
            <Box
              px={{ base: 5, md: 8 }}
              pt={8}
              pb={5}
              bg="linear-gradient(180deg, rgba(239,246,255,0.9), rgba(255,255,255,0.96))"
              borderBottomWidth="1px"
              borderColor="blackAlpha.50"
            >
              <ModalHeader
                p={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={3}
                flexWrap="wrap"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="800"
                color="gray.800"
                lineHeight="1.1"
              >
                <Text as="span" color="gray.800">
                  {user?.name}
                </Text>
                <Badge
                  colorScheme={user?.visibilityStatus === "away" ? "yellow" : "green"}
                  borderRadius="full"
                  px={4}
                  py={1.5}
                  fontSize="0.55em"
                  fontWeight="800"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  bg={user?.visibilityStatus === "away" ? "yellow.100" : "green.100"}
                  color={user?.visibilityStatus === "away" ? "yellow.700" : "green.700"}
                >
                  {user?.visibilityStatus === "away" ? "Away" : "Online"}
                </Badge>
              </ModalHeader>
            </Box>

            <ModalBody px={{ base: 5, md: 8 }} py={6}>
              <VStack spacing={6}>
                <Image
                  borderRadius="full"
                  boxSize={{ base: "104px", md: "148px" }}
                  src={user?.pic}
                  alt={user?.name}
                  objectFit="cover"
                  shadow="0 20px 45px rgba(15, 23, 42, 0.14)"
                  borderWidth="5px"
                  borderColor="white"
                />
                <Box
                  w="100%"
                  borderRadius="2xl"
                  bg="linear-gradient(180deg, rgba(255,247,237,0.9), rgba(255,255,255,0.98))"
                  borderWidth="1px"
                  borderColor="orange.100"
                  px={{ base: 4, md: 5 }}
                  py={5}
                >
                  <Text
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.12em"
                    fontWeight="700"
                    color="orange.500"
                    mb={3}
                  >
                    Email
                  </Text>
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    color="gray.700"
                    wordBreak="break-word"
                    fontWeight="500"
                  >
                    {user?.email}
                  </Text>
                </Box>
                {user?.lastSeenAt ? (
                  <Text fontSize="sm" color="blue.600" fontWeight="500">
                    Last active {new Date(user.lastSeenAt).toLocaleString()}
                  </Text>
                ) : null}
              </VStack>
            </ModalBody>

            <ModalFooter justifyContent="center" px={{ base: 5, md: 8 }} pb={8} pt={2}>
              <Button
                colorScheme="orange"
                onClick={onClose}
                px={10}
                borderRadius="full"
                boxShadow="0 14px 30px rgba(251, 191, 36, 0.22)"
              >
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
