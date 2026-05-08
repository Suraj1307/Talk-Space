import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import Homepage from "./Pages/Homepage";
import ChatPage from "./Pages/ChatPage";
import ClerkAuthSync from "./components/Authentication/ClerkAuthSync";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import PublicAuthRoute from "./components/Auth/PublicAuthRoute";

function App() {
  const clerkEnabled = /^pk_(test|live)_/i.test(
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || ""
  );

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            <PublicAuthRoute>
              <Homepage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        {clerkEnabled ? (
          <>
            <Route
              path="/sso-callback"
              element={<AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/auth/clerk-sync" />}
            />
            <Route path="/auth/clerk-sync" element={<ClerkAuthSync />} />
          </>
        ) : null}
      </Routes>
    </div>
  );
}

export default App;
