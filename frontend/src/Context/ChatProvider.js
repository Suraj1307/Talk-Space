import React, { createContext, useContext, useEffect, useState } from "react";
import { getStoredUserInfo } from "../config/storage";

const ChatContext = createContext();

const sortChatsByActivity = (chatList = []) =>
  [...chatList].sort((a, b) => {
    const aTime = new Date(a.latestMessage?.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.latestMessage?.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState();
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chatsState, setChatsState] = useState();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = useState(false);
  const [visibilityStatus, setVisibilityStatus] = useState("online");
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    setUser(userInfo);
    const savedVisibility = localStorage.getItem("talk-space-visibility-status");
    if (savedVisibility === "online" || savedVisibility === "away") {
      setVisibilityStatus(savedVisibility);
    }
  }, []);

  const openSearchDrawer = (focusSearch = false) => {
    setIsSearchOpen(true);
    setShouldFocusSearch(focusSearch);
  };

  const closeSearchDrawer = () => {
    setIsSearchOpen(false);
    setShouldFocusSearch(false);
  };

  const updateVisibilityStatus = (status) => {
    setVisibilityStatus(status);
    localStorage.setItem("talk-space-visibility-status", status);
  };

  const setChats = (valueOrUpdater) => {
    setChatsState((prevChats) => {
      const nextChats =
        typeof valueOrUpdater === "function" ? valueOrUpdater(prevChats || []) : valueOrUpdater;

      if (!nextChats) return nextChats;
      return sortChatsByActivity(nextChats);
    });
  };

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats: chatsState,
        setChats,
        isSearchOpen,
        openSearchDrawer,
        closeSearchDrawer,
        shouldFocusSearch,
        setShouldFocusSearch,
        visibilityStatus,
        updateVisibilityStatus,
        onlineUsers,
        setOnlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
