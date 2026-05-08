import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

function Homepage() {
  return (
    <Container maxW="2xl" centerContent py={{ base: 6, md: 10 }}>
      <Box
        w="100%"
        maxW="720px"
      >
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
