import { defineStore } from "pinia";
import {
  getActivity,
  getRecipe,
  searchLocations,
  getActivities,
  getRecipes,
  getKeywords,
} from "@/utils/axios/api_routes";
import { activityNone } from "@/utils/activityNone";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activities: [],
    recipes: [],
    keywords: [],
    activity: null,
    recipe: null,
    location: null,
    locations: null,
    showCombined: true,
    isLoaded: false,
  }),
  getters: {
    activitySelected: (state) => {
      return state.activity !== null && state.activity.id !== "activity-none";
    },
    recipeSelected: (state) => {
      return state.recipe !== null && state.recipe.id !== "activity-none";
    },
  },
  actions: {
    async fetchActivitiesData() {
      if (this.isLoaded) return;

      const [{ data: activities }, { data: recipes }, { data: keywords }] =
        await Promise.all([getActivities(), getRecipes(), getKeywords()]);

      this.activities = activities;
      this.keywords = keywords;
      this.recipes = recipes;

      this.isLoaded = true;
    },

    setActivity(activity) {
      this.recipe = activityNone;
      this.activity = { ...activity, value: activity.name };
    },
    setRecipe(recipe) {
      this.activity = activityNone;
      this.recipe = { ...recipe, value: recipe.name };
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
    async loadRecipe(id) {
      const { data: recipe } = await getRecipe({ id });
      this.setRecipe(recipe);
    },
  },
});
