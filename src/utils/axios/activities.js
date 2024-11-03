import getHost from "../getHost";
import { axiosInstance as axios } from "./axiosConfig";

export function getSkills() {
  return axios.get(`${getHost()}activities/skills`);
}
