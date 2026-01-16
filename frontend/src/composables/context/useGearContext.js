import { computed } from "vue";
import useBaseContext from "./useBaseContext";
import { useGearStore } from "@/store/gear";

function fallback(primary, fallback) {
  return computed(() => primary?.value ?? fallback.value);
}

export function useGearContext(gearSetIndex, overrides = {}) {
  const baseCtx = useBaseContext();
  const gearStore = useGearStore();

  return {
    ...baseCtx,

    location: fallback(overrides.location, baseCtx.location),
    service: fallback(overrides.service, baseCtx.service),

    gearSlots: computed(() => gearStore.gearset(gearSetIndex)),
    equippedGear: computed(() => gearStore.equippedGearByIndex(gearSetIndex)),
    filledGearSlots: computed(() =>
      gearStore.filledGearSlotsByIndex(gearSetIndex)
    ),
  };
}
