import { defineStore } from "pinia";
import { getActivity } from "@/utils/axios/api_routes";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activity: null,
  }),
  actions: {
    setActivity(activity) {
      this.activity = activity;
    },
    async loadActivity(id) {
      const activity = await getActivity({ id });
      this.setActivity(activity);
    },
  },
});
