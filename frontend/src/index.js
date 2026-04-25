import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import ChatProvider from "./Context/ChatProvider";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      "html, body": {
        bg: "#f7fbff",
        color: "#1f2937",
      },
    },
  },
  components: {
    Modal: {
      baseStyle: {
        dialog: {
          bg: "rgba(255,255,255,0.98)",
          color: "gray.800",
          borderRadius: "24px",
          borderWidth: "1px",
          borderColor: "blackAlpha.100",
          boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18)",
        },
        dialogContainer: {
          backdropFilter: "blur(8px)",
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "rgba(255,255,255,0.98)",
          color: "gray.800",
          borderColor: "blackAlpha.100",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
        },
        item: {
          bg: "transparent",
          color: "gray.800",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: "rgba(255,255,255,0.98)",
          color: "gray.800",
        },
      },
    },
  },
});

// Get the root container
const container = document.getElementById("root");

// Create a React 18 root
const root = createRoot(container);

// Render the app
root.render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <ChatProvider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </ChatProvider>
  </BrowserRouter>
);
