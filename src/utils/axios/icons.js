import getHost from "../getHost";
import { axiosInstance as axios } from "./axiosConfig";

export function getIcon({ path }) {
  return axios.get(`${getHost()}icons`, {
    params: { path },
    responseType: "blob",
  });
}
