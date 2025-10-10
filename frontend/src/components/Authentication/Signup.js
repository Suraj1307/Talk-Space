import React, { useState } from "react";
import {
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Box,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [pic, setPic] = useState("");
  const [picPreview, setPicPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate(); 

  const defaultPic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  const getPasswordStrength = () => {
    if (password.length >= 10) return 100;
    if (password.length >= 7) return 70;
    if (password.length >= 4) return 40;
    return 20;
  };

  const validateFields = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
    if (!password) newErrors.password = "Password is required";
    if (password !== confirmpassword)
      newErrors.confirmpassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitHandler = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post(
        "/api/user",
        { name, email, password, pic: pic || defaultPic },
        config
      );

      toast({
        title: "Registration Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
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
        position: "top",
      });
      setLoading(false);
    }
  };

  const handlePicUpload = (file) => {
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image must be smaller than 10MB",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPicPreview(reader.result);
    reader.readAsDataURL(file);

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "Chat-App");

    fetch("https://api.cloudinary.com/v1_1/djspdehhj/image/upload", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((result) => setPic(result.secure_url))
      .catch(() => {
        toast({
          title: "Upload Failed",
          description: "Something went wrong while uploading image",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      });
  };

  return (
    <Box
      maxW="400px"
      w="100%"
      mx="auto"
      mt={5}
      p={6}
      bg="gray.50"
      borderRadius="lg"
      boxShadow="md"
    >
      <VStack spacing={4}>
        <FormControl isRequired isInvalid={errors.name}>
          <FormLabel>Name</FormLabel>
          <Input
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="white"
            color="black"
            border="1px solid gray"
            borderRadius="md"
          />
          {errors.name && <Text color="red.500" fontSize="sm">{errors.name}</Text>}
        </FormControl>

        <FormControl isRequired isInvalid={errors.email}>
          <FormLabel>Email Address</FormLabel>
          <Input
            type="email"
            placeholder="Enter Your Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="white"
            color="black"
            border="1px solid gray"
            borderRadius="md"
          />
          {errors.email && <Text color="red.500" fontSize="sm">{errors.email}</Text>}
        </FormControl>

        <FormControl isRequired isInvalid={errors.password}>
          <FormLabel>Password</FormLabel>
          <InputGroup size="md">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="white"
              color="black"
              border="1px solid gray"
              borderRadius="md"
            />
            <InputRightElement width="4.5rem">
              <Button size="sm" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
          </InputGroup>
          {password && (
            <Progress
              value={getPasswordStrength()}
              size="xs"
              colorScheme={
                getPasswordStrength() < 50
                  ? "red"
                  : getPasswordStrength() < 80
                  ? "yellow"
                  : "green"
              }
              mt={1}
            />
          )}
          {errors.password && <Text color="red.500" fontSize="sm">{errors.password}</Text>}
        </FormControl>

        <FormControl isRequired isInvalid={errors.confirmpassword}>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup size="md">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmpassword}
              onChange={(e) => setConfirmpassword(e.target.value)}
              bg="white"
              color="black"
              border="1px solid gray"
              borderRadius="md"
            />
            <InputRightElement width="4.5rem">
              <Button size="sm" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
          </InputGroup>
          {errors.confirmpassword && <Text color="red.500" fontSize="sm">{errors.confirmpassword}</Text>}
        </FormControl>

        <FormControl>
          <FormLabel>Upload your Picture</FormLabel>
          <Input
            type="file"
            p={1.5}
            accept="image/*"
            onChange={(e) => handlePicUpload(e.target.files[0])}
            bg="white"
            border="1px solid gray"
            borderRadius="md"
          />
          {picPreview && (
            <Box mt={2}>
              <Text fontSize="sm">Preview:</Text>
              <img
                src={picPreview}
                alt="Preview"
                width="80"
                height="80"
                style={{ borderRadius: "50%" }}
              />
            </Box>
          )}
        </FormControl>

        <Button
          colorScheme="teal"
          width="100%"
          mt={4}
          onClick={submitHandler}
          isLoading={loading}
          borderRadius="md"
        >
          Sign Up
        </Button>
      </VStack>
    </Box>
  );
};

export default Signup;
