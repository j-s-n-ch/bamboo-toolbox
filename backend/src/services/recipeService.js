import BaseService from "./baseService.js";

class RecipeService extends BaseService {
  constructor() {
    super("recipes");
  }

  async fetchCraftingRecipes() {
    return this.search({ relatedSkills: "crafting", detailed: true });
  }

  async fetchTrinketryRecipes() {
    return this.search({ relatedSkills: "trinketry", detailed: true });
  }
}

export default RecipeService;
