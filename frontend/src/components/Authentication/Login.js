import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/apiClient";

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const emailError = email && !/\S+@\S+\.\S+/.test(email) ? "Enter a valid email address" : "";
  const passwordError =
    password && password.length < 6 ? "Password should be at least 6 characters" : "";

  const submitHandler = async () => {
    if (!email || !password) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (emailError || passwordError) {
      toast({
        title: "Please fix the highlighted fields",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.post("/api/user/login", { email, password });

      toast({
        title: "Login successful",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/chats");
    } catch (error) {
      toast({
        title: "Error occurred",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const guestLoginHandler = () => {
    setEmail("guest1234@gmail.com");
    setPassword("123456");
    toast({
      title: "Guest credentials filled",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
  };

  return (
    <Box
      w="100%"
      maxW="400px"
      mx="auto"
      mt={8}
      p={6}
      bg="rgba(255,255,255,0.72)"
      borderRadius="2xl"
      boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      backdropFilter="blur(14px)"
    >
      <VStack spacing={4} w="100%">
        <FormControl id="login-email" isRequired isInvalid={Boolean(emailError)}>
          <FormLabel>Email Address</FormLabel>
          <Input
            value={email}
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            focusBorderColor="orange.300"
            borderRadius="xl"
            bg="white"
            color="black"
            border="1px solid #d6d3d1"
          />
          {emailError ? <Text color="red.500" fontSize="sm" mt={2}>{emailError}</Text> : null}
        </FormControl>

        <FormControl id="login-password" isRequired isInvalid={Boolean(passwordError)}>
          <FormLabel>Password</FormLabel>
          <InputGroup size="md">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              focusBorderColor="orange.300"
              borderRadius="xl"
              bg="white"
              color="black"
              border="1px solid #d6d3d1"
              onKeyDown={(e) => e.key === "Enter" && submitHandler()}
            />
            <InputRightElement width="3.5rem">
              <Button
                size="sm"
                h="1.75rem"
                variant="ghost"
                color="gray.600"
                onClick={() => setShow((prev) => !prev)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                <Icon as={show ? HiEyeOff : HiEye} boxSize={4} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {passwordError ? (
            <Text color="red.500" fontSize="sm" mt={2}>
              {passwordError}
            </Text>
          ) : null}
        </FormControl>

        <Button
          colorScheme="orange"
          width="100%"
          onClick={submitHandler}
          isLoading={loading}
          borderRadius="full"
          bg="orange.400"
          color="white"
          _hover={{ bg: "orange.500", transform: "translateY(-1px)" }}
          _active={{ bg: "orange.600" }}
        >
          Login
        </Button>

        <Button
          variant="outline"
          colorScheme="orange"
          width="100%"
          onClick={guestLoginHandler}
          borderRadius="full"
        >
          Use Guest Credentials
        </Button>

        <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
          Tip: use the guest login to explore the app quickly.
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;
