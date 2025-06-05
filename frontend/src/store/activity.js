import { defineStore } from "pinia";
import { getActivity } from "@/utils/axios/api_routes";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activity: null,
  }),
  getters: {
    activitySelected: (state) => {
      return state.activity !== null && state.activity.id !== "activity-none";
    },
  },
  actions: {
    setActivity(activity) {
      this.activity = activity;
    },
    async loadActivity(id) {
      const { data: activity } = await getActivity({ id });
      this.setActivity(activity);
    },
  },
});
