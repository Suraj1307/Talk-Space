import { Navigate, useLocation } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";
import { getStoredUserInfo } from "../../config/storage";

const ProtectedRoute = ({ children }) => {
  const { user } = ChatState();
  const location = useLocation();
  const storedUser = getStoredUserInfo();

  if (!user && !storedUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
