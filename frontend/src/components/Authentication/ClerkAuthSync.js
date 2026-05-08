import { Box, Spinner, Text, VStack, useToast } from "@chakra-ui/react";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/apiClient";
import { getStoredUserInfo } from "../../config/storage";
import { ChatState } from "../../Context/ChatProvider";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ClerkAuthSync = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { setUser } = ChatState();
  const navigate = useNavigate();
  const toast = useToast();
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const existingUser = getStoredUserInfo();
    if (existingUser) {
      hasCompletedRef.current = true;
      setUser(existingUser);
      navigate("/chats", { replace: true });
      return;
    }

    if (hasCompletedRef.current) {
      return;
    }

    if (!isLoaded || !isSignedIn || hasStartedRef.current) {
      if (isLoaded && !isSignedIn) {
        navigate("/", { replace: true });
      }

      return;
    }

    hasStartedRef.current = true;

    const syncSession = async () => {
      try {
        let clerkToken = "";

        for (let attempt = 0; attempt < 4; attempt += 1) {
          clerkToken = (await getToken()) || "";
          if (clerkToken) break;
          await wait(350);
        }

        if (!clerkToken) {
          throw new Error("No Clerk session token was returned");
        }

        let data;
        let lastError;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const response = await apiClient.post(
              "/api/user/clerk/sync",
              {},
              {
                headers: {
                  Authorization: `Bearer ${clerkToken}`,
                },
              }
            );
            data = response.data;
            break;
          } catch (error) {
            lastError = error;
            if (attempt < 2) {
              await wait(400);
            }
          }
        }

        if (!data) {
          throw lastError || new Error("Unable to complete Google sign-in");
        }

        localStorage.setItem("userInfo", JSON.stringify(data));
        setUser(data);
        hasCompletedRef.current = true;
        navigate("/chats", { replace: true });
      } catch (error) {
        hasStartedRef.current = false;
        localStorage.removeItem("userInfo");
        if (!toast.isActive("clerk-auth-sync-error")) {
          toast({
            id: "clerk-auth-sync-error",
            title: "Google sign-in failed",
            description: error.response?.data?.message || error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
        navigate("/", { replace: true });
      }
    };

    syncSession();
  }, [getToken, isLoaded, isSignedIn, navigate, setUser, toast]);

  return (
    <Box
      w="100%"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <VStack spacing={4} textAlign="center">
        <Spinner size="xl" color="orange.400" thickness="4px" />
        <Text color="gray.600" fontWeight="600">
          Finishing your Google sign-in...
        </Text>
      </VStack>
    </Box>
  );
};

export default ClerkAuthSync;
