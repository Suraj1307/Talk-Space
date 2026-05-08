import { Box, Button, Divider, Text, VStack, useToast } from "@chakra-ui/react";
import { useAuth, useSignIn } from "@clerk/clerk-react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

const GoogleOAuthButton = ({ label = "Sign in with Google" }) => {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn } = useSignIn();
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !authLoaded) {
      return;
    }

    if (isSignedIn) {
      navigate("/auth/clerk-sync");
      return;
    }

    if (!signIn) {
      return;
    }

    try {
      const origin = window.location.origin;

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${origin}/sso-callback`,
        redirectUrlComplete: `${origin}/auth/clerk-sync`,
      });
    } catch (error) {
      if (/already signed in/i.test(error?.errors?.[0]?.longMessage || error?.message || "")) {
        navigate("/auth/clerk-sync");
        return;
      }

      toast({
        title: "Google sign-in could not start",
        description: error?.errors?.[0]?.longMessage || error?.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <VStack
      spacing={3}
      w="100%"
      pt={3}
      mt={2}
      align="stretch"
      bg="rgba(248,250,252,0.9)"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      borderRadius="2xl"
      px={4}
      py={4}
    >
      <Box position="relative" w="100%" py={1}>
        <Divider borderColor="gray.300" />
        <Text
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          px={3}
          bg="rgba(248,250,252,0.98)"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.01em"
          color="gray.600"
        >
          OR CONTINUE WITH
        </Text>
      </Box>
      <Button
        width="100%"
        variant="solid"
        leftIcon={<FcGoogle />}
        onClick={handleGoogleSignIn}
        isDisabled={!isLoaded || !authLoaded}
        borderRadius="full"
        bg="white"
        color="gray.800"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="0 10px 25px rgba(15, 23, 42, 0.08)"
        _hover={{ bg: "gray.50", transform: "translateY(-1px)" }}
        _active={{ bg: "gray.100" }}
      >
        {label}
      </Button>
    </VStack>
  );
};

export default GoogleOAuthButton;
