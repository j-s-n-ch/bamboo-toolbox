import axios from 'axios';

const AXIOS_TIMEOUT = 30000;

export const measureRequestTime = config => {
  config.startTime = Math.round(performance.now());
  return config;
};

const apiResponse = response => {
  if (response) {
    const { config } = response;
    config.stopTime = Math.round(performance.now());

    return response;
  }
  return Promise.resolve(response);
};

export const createAxiosInstance = () => {
  const instance = axios.create();
  instance.interceptors.request.use(measureRequestTime);

  instance.interceptors.response.use(apiResponse);
  instance.defaults.timeout = AXIOS_TIMEOUT;

  return instance;
};

export const axiosInstance = createAxiosInstance();