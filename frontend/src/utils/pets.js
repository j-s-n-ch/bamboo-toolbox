export function getPetIcon(pet, level, isRare = false) {
  if (level == 0) return pet.egg.sprite;
  const { stage } = pet.levels[Number(level - 1)];
  const source = isRare ? pet.rareLooks[0].sprites : pet.looks[0].sprites;
  return source.find((look) => look.stage === stage).sprite;
}
