import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = 'a1b2c3d4e5f6789abc0d1234567890abc';
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
