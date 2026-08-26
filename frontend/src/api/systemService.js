// Host system metrics (/api/v1/system/health): cpu / ram / storage / bandwidth.
import apiClient from "./apiClient";

const systemService = {
  getHealth() {
    return apiClient.get("/system/health");
  },
};

export default systemService;
