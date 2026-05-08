import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const PublicAuthRoute = ({ children }) => {
  const { user } = ChatState();
  const { isLoaded, isSignedIn } = useAuth();

  if (user) {
    return <Navigate to="/chats" replace />;
  }

  if (isLoaded && isSignedIn) {
    return <Navigate to="/auth/clerk-sync" replace />;
  }

  return children;
};

export default PublicAuthRoute;
