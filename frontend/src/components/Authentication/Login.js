import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Box,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 

const Login = () => {
  const [show, setShow] = useState(false);
  const toast = useToast();
  const navigate = useNavigate(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = () => setShow(!show);

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      navigate("/chats"); 
    } catch (error) {
      toast({
        title: "Error Occurred",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
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
      bg="gray.50"
      borderRadius="md"
      boxShadow="md"
    >
      <VStack spacing={4} w="100%">
        <FormControl id="login-email" isRequired>
          <FormLabel>Email Address</FormLabel>
          <Input
            value={email}
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            focusBorderColor="teal.400"
            borderRadius="md"
            bg="white"
            color="black"
            border="1px solid gray"
          />
        </FormControl>

        <FormControl id="login-password" isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup size="md">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              focusBorderColor="teal.400"
              borderRadius="md"
              bg="white"
              color="black"
              border="1px solid gray"
              onKeyDown={(e) => e.key === "Enter" && submitHandler()}
            />
            <InputRightElement width="4.5rem">
              <Button size="sm" h="1.75rem" onClick={handleClick}>
                {show ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          colorScheme="teal"
          width="100%"
          onClick={submitHandler}
          isLoading={loading}
          borderRadius="md"
        >
          Login
        </Button>

        <Button
          variant="outline"
          colorScheme="teal"
          width="100%"
          onClick={guestLoginHandler}
          borderRadius="md"
        >
          Use Guest Credentials
        </Button>
      </VStack>
    </Box>
  );
};

export default Login;
