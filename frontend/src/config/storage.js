export const getStoredUserInfo = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("userInfo") || "null");
  } catch (error) {
    localStorage.removeItem("userInfo");
    return null;
  }
};
