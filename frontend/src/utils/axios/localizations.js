import getHost from "../getHost";
import { axiosInstance as axios } from "./axiosConfig";

export function getLocalization({ key, locale = en }) {
  return axios.get(`${getHost()}translate`, {
    params: { key, locale },
  });
}
