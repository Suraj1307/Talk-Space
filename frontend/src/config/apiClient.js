import axios from "axios";
import { API_BASE_PATH } from "./appConfig";

export const apiClient = axios.create({
  baseURL: API_BASE_PATH,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      /session expired|not authorized/i.test(message)
    ) {
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export const getAuthConfig = (token, extraHeaders = {}) => ({
  headers: {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});
