import {
  Box,
  Container,
  HStack,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect } from "react";
import { HiMiniEllipsisHorizontal } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
`;

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) navigate("/chats");
  }, [navigate]);

  return (
    <Container maxW="6xl" centerContent py={{ base: 6, md: 10 }}>
      <Box
        w="100%"
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "1.05fr 0.95fr" }}
        gap={{ base: 6, lg: 10 }}
        alignItems="stretch"
      >
        <Box
          bg="rgba(255,248,240,0.72)"
          borderRadius="3xl"
          p={{ base: 5, md: 10 }}
          borderWidth="1px"
          borderColor="whiteAlpha.500"
          backdropFilter="blur(20px)"
          boxShadow="0 30px 80px rgba(15, 23, 42, 0.10)"
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            top="-40px"
            right="-20px"
            w="220px"
            h="220px"
            bg="linear-gradient(180deg, rgba(251,146,60,0.32), rgba(251,191,36,0.08))"
            borderRadius="full"
            filter="blur(10px)"
          />

          <VStack align="start" spacing={6} position="relative" zIndex={1}>
            <Text
              as="span"
              px={4}
              py={2}
              bg="whiteAlpha.700"
              borderRadius="full"
              fontSize="sm"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="gray.700"
              fontWeight="700"
            >
              Real-time conversations
            </Text>

            <Text
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight={{ base: "1.05", md: "0.95" }}
              fontWeight="700"
              fontFamily="Work Sans"
              color="gray.900"
            >
              Talk-Space
            </Text>

            <Text fontSize={{ base: "lg", md: "2xl" }} maxW="560px" color="gray.700">
              A warm, fast place for one-to-one chats, lively groups, and instant updates that feel
              personal.
            </Text>

            <HStack
              spacing={3}
              px={4}
              py={3}
              bg="rgba(255,255,255,0.58)"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="whiteAlpha.600"
              align="flex-start"
              flexDir={{ base: "column", sm: "row" }}
            >
              <HStack spacing={1} aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <Box
                    key={dot}
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="orange.400"
                    animation={`${bounce} 1.25s infinite`}
                    animationDelay={`${dot * 0.15}s`}
                  />
                ))}
              </HStack>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                Live presence, typing cues, and quick replies that feel active the moment you land.
              </Text>
            </HStack>

            <HStack spacing={3} flexWrap="wrap">
              <Box px={4} py={2} bg="whiteAlpha.800" borderRadius="full" fontWeight="600">
                Live messaging
              </Box>
              <Box px={4} py={2} bg="whiteAlpha.800" borderRadius="full" fontWeight="600">
                Group chats
              </Box>
              <Box
                px={4}
                py={2}
                bg="whiteAlpha.800"
                borderRadius="full"
                fontWeight="600"
                display="inline-flex"
                alignItems="center"
                gap={2}
              >
                <Icon as={HiMiniEllipsisHorizontal} color="orange.400" boxSize={5} />
                Typing indicators
              </Box>
            </HStack>

            <Text fontSize="sm" color="gray.500" maxW="520px">
              Sign in to jump back into your conversations, or create a fresh account and start a
              new circle.
            </Text>
          </VStack>
        </Box>

        <Box
          bg="rgba(255,255,255,0.74)"
          w="100%"
          p={{ base: 4, md: 6 }}
          borderRadius="3xl"
          borderWidth="1px"
          borderColor="whiteAlpha.500"
          backdropFilter="blur(20px)"
          boxShadow="0 30px 80px rgba(15, 23, 42, 0.10)"
        >
          <Tabs isFitted variant="soft-rounded" colorScheme="orange">
            <TabList
              mb="1.25rem"
              bg="rgba(15,23,42,0.04)"
              p={1}
              borderRadius="full"
              gap={1}
            >
              <Tab
                borderRadius="full"
                fontWeight="700"
                color="gray.700"
                _selected={{
                  bg: "orange.400",
                  color: "white",
                  boxShadow: "0 10px 30px rgba(251, 146, 60, 0.28)",
                }}
              >
                Login
              </Tab>
              <Tab
                borderRadius="full"
                fontWeight="700"
                color="gray.700"
                _selected={{
                  bg: "orange.400",
                  color: "white",
                  boxShadow: "0 10px 30px rgba(251, 146, 60, 0.28)",
                }}
              >
                Sign Up
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Login />
              </TabPanel>
              <TabPanel px={0}>
                <Signup />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    </Container>
  );
}

export default Homepage;
