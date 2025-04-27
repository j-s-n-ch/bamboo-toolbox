import getHost from "../getHost";
import { axiosInstance as axios } from "./axiosConfig";

export function getItem({ name, id, quality }) {
  return axios.get(`${getHost()}items`, {
    params: { name, id, quality },
  });
}

export function searchItems({ types, gearType, search }) {
  return axios.get(`${getHost()}items/search`, {
    params: { types, gearType, search },
  });
}
