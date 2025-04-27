import getHost from "../getHost";
import { axiosInstance as axios } from "./axiosConfig";

export function getSkills() {
  return axios.get(`${getHost()}activities/skills`);
}

export function getActivities() {
  return axios.get(`${getHost()}activities/`);
}

export function search({ skill }) {
  return axios.get(`${getHost()}activities/search`, {
    params: { relatedSkillsList: skill },
  });
}

export function getActivity({ id }) {
  return axios.get(`${getHost()}activities/id/${id}`);
}
