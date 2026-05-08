import { Navigate, useLocation } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const ProtectedRoute = ({ children }) => {
  const { user } = ChatState();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
