import axios from "axios";
import { beginRequest, endRequest } from "./loadingBus";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  beginRequest();
  return config;
});

api.interceptors.response.use(
  (response) => {
    endRequest();
    return response;
  },
  (error) => {
    endRequest();
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
