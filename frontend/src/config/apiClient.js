import axios from "axios";
import { API_BASE_PATH } from "./appConfig";

export const apiClient = axios.create({
  baseURL: API_BASE_PATH,
});

export const getAuthConfig = (token, extraHeaders = {}) => ({
  headers: {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});
