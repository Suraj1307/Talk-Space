import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { apiClient } from "../../config/apiClient";
import { ChatState } from "../../Context/ChatProvider";
import GoogleOAuthButton from "./GoogleOAuthButton";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pic, setPic] = useState("");
  const [picPreview, setPicPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const navigate = useNavigate();
  const { setUser } = ChatState();

  const defaultPic =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

  const getPasswordStrength = () => {
    if (password.length >= 10) return 100;
    if (password.length >= 7) return 70;
    if (password.length >= 4) return 40;
    return password.length ? 20 : 0;
  };

  const validateFields = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
    if (!password) newErrors.password = "Password is required";
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitHandler = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      const { data } = await apiClient.post("/api/user", {
        name,
        email,
        password,
        pic: pic || defaultPic,
      });

      toast({
        title: "Registration successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      navigate("/chats");
    } catch (error) {
      toast({
        title: "Error occurred",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSelectedImage = () => {
    setPic("");
    setPicPreview("");
    setUploadProgress(0);
  };

  const handlePicUpload = async (file) => {
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

    try {
      setUploadingPic(true);
      setUploadProgress(15);

      const { data: signatureData } = await apiClient.get("/api/user/cloudinary-signature");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", signatureData.timestamp);
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      const response = await apiClient.post(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          },
        }
      );

      setPic(response.data.secure_url);
      setUploadProgress(100);
      toast({
        title: "Image uploaded",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      clearSelectedImage();
      toast({
        title: "Upload failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Image upload is not configured right now",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitHandler();
  };

  return (
    <Box
      maxW="400px"
      w="100%"
      mx="auto"
      mt={5}
      p={6}
      bg="rgba(255,255,255,0.72)"
      borderRadius="2xl"
      boxShadow="0 24px 60px rgba(15, 23, 42, 0.08)"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      backdropFilter="blur(14px)"
    >
      <VStack as="form" spacing={4} onSubmit={handleSubmit}>
        <FormControl isRequired isInvalid={errors.name}>
          <FormLabel>Name</FormLabel>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            bg="white"
            color="black"
            border="1px solid #d6d3d1"
            borderRadius="xl"
          />
          {errors.name ? <Text color="red.500" fontSize="sm">{errors.name}</Text> : null}
        </FormControl>

        <FormControl isRequired isInvalid={errors.email}>
          <FormLabel>Email Address</FormLabel>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            bg="white"
            color="black"
            border="1px solid #d6d3d1"
            borderRadius="xl"
          />
          {errors.email ? <Text color="red.500" fontSize="sm">{errors.email}</Text> : null}
        </FormControl>

        <FormControl isRequired isInvalid={errors.password}>
          <FormLabel>Password</FormLabel>
          <InputGroup size="md">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="white"
              color="black"
              border="1px solid #d6d3d1"
              borderRadius="xl"
            />
            <InputRightElement width="4.5rem">
              <Button
                size="sm"
                variant="ghost"
                color="gray.600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon as={showPassword ? HiEyeOff : HiEye} boxSize={4} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {password ? (
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
              mt={2}
              borderRadius="full"
            />
          ) : null}
          {errors.password ? <Text color="red.500" fontSize="sm">{errors.password}</Text> : null}
        </FormControl>

        <FormControl isRequired isInvalid={errors.confirmPassword}>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup size="md">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              bg="white"
              color="black"
              border="1px solid #d6d3d1"
              borderRadius="xl"
            />
            <InputRightElement width="4.5rem">
              <Button
                size="sm"
                variant="ghost"
                color="gray.600"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
              >
                <Icon as={showConfirm ? HiEyeOff : HiEye} boxSize={4} />
              </Button>
            </InputRightElement>
          </InputGroup>
          {errors.confirmPassword ? (
            <Text color="red.500" fontSize="sm">{errors.confirmPassword}</Text>
          ) : null}
        </FormControl>

        <FormControl>
          <FormLabel>Profile Picture</FormLabel>
          <Input
            type="file"
            p={1.5}
            accept="image/png,image/jpeg"
            onChange={(e) => handlePicUpload(e.target.files[0])}
            bg="white"
            border="1px solid #d6d3d1"
            borderRadius="xl"
          />
          {uploadingPic ? (
            <Box mt={2}>
              <Progress value={uploadProgress} size="sm" colorScheme="orange" borderRadius="full" />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Uploading image... {uploadProgress}%
              </Text>
            </Box>
          ) : null}
          {picPreview ? (
            <Box mt={3}>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Preview
              </Text>
              <Box display="flex" alignItems="center" gap={3}>
                <img
                  src={picPreview}
                  alt="Preview"
                  width="80"
                  height="80"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                <Button size="sm" type="button" variant="outline" onClick={clearSelectedImage}>
                  Remove
                </Button>
              </Box>
            </Box>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Optional. PNG or JPG up to 10MB.
            </Text>
          )}
        </FormControl>

        <Button
          colorScheme="orange"
          width="100%"
          mt={4}
          type="submit"
          isLoading={loading || uploadingPic}
          borderRadius="full"
          isDisabled={uploadingPic}
          _hover={{ bg: "orange.500", transform: "translateY(-1px)" }}
          _active={{ bg: "orange.600" }}
        >
          {uploadingPic ? "Uploading image..." : "Sign Up"}
        </Button>

        {process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? <GoogleOAuthButton label="Continue with Google" /> : null}
      </VStack>
    </Box>
  );
};

export default Signup;
