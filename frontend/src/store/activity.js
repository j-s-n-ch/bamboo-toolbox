import { defineStore } from "pinia";
import {
  getActivity,
  searchLocations,
  getActivities,
  getKeywords,
} from "@/utils/axios/api_routes";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activities: [],
    keywords: [],
    activity: null,
    location: null,
    locations: null,
    showCombined: true,
    isLoaded: false,
  }),
  getters: {
    activitySelected: (state) => {
      return state.activity !== null && state.activity.id !== "activity-none";
    },
  },
  actions: {
    async fetchActivitiesData() {
      if (this.isLoaded) return;

      const [{ data: activities }, { data: keywords }] = await Promise.all([
        getActivities(),
        getKeywords(),
      ]);

      this.keywords = keywords;
      this.activities = activities;

      this.isLoaded = true;
    },

    setActivity(activity) {
      this.activity = { ...activity, value: activity.name };
    },
    setLocations(locations) {
      this.locations = locations;
    },
    setLocation(location) {
      this.location = location;
    },
    async loadActivity(id) {
      const { data: activity } = await getActivity({ id });
      this.setActivity(activity);
    },
    async loadActivityLocations(id) {
      const { data: locations } = await searchLocations({ activityList: id });
      this.setLocations(locations);
      if (locations.length) this.setLocation(locations[0]);
    },
  },
});
