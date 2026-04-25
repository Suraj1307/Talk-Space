const isBrowser = typeof window !== "undefined";

const getRuntimeApiOrigin = () => {
  if (!isBrowser) return "";

  const { protocol, hostname, port, origin } = window.location;
  const isReactDevServerPort = port === "3000";

  if (!isReactDevServerPort) {
    return origin;
  }

  return `${protocol}//${hostname}:5000`;
};

const isReactDevServer = () => {
  if (!isBrowser) return false;
  return window.location.port === "3000";
};

export const API_ORIGIN =
  process.env.REACT_APP_API_URL || getRuntimeApiOrigin();

export const API_BASE_PATH =
  process.env.REACT_APP_API_BASE_PATH ||
  (isReactDevServer() ? "" : API_ORIGIN ? `${API_ORIGIN}` : "");

export const SOCKET_ENDPOINT =
  process.env.REACT_APP_SOCKET_URL || API_ORIGIN;
