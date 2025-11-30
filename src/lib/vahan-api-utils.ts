import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_VAHAN_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const fetchHierarchyData = async (metricType: string) => {
  const res = await apiClient.get(`/metrics/hierarchy?metric_type=${metricType}`);
  return res.data;
};
