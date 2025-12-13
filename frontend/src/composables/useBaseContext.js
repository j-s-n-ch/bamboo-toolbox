import { computed } from "vue";
import { useActivityStore } from "@/store/activity";
import { usePlayerStore } from "@/store/player";
import { useItemsStore } from "@/store/items";

function useBaseCalculationContext() {
  const activityStore = useActivityStore();
  const playerStore = usePlayerStore();
  const itemsStore = useItemsStore();

  return {
    activitySelected: computed(() => activityStore.activitySelected),
    recipeSelected: computed(() => activityStore.recipeSelected),

    activity: computed(() => activityStore.activity),
    recipe: computed(() => activityStore.recipe),

    skillLevels: computed(() => playerStore.skillLevels),

    items: computed(() => itemsStore.allItems),
  };
}

export default useBaseCalculationContext;
