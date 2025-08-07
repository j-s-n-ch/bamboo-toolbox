// Command classes for gear operations

export class EquipItemCommand {
  constructor(gearStore, slot, newItem, previousItem = null) {
    this.gearStore = gearStore;
    this.slot = slot;
    this.newItem = newItem;
    this.previousItem = previousItem;
    this.description = newItem 
      ? `Equip ${newItem.name} to ${slot}`
      : `Unequip ${slot}`;
  }

  async execute() {
    // Don't record history during execute/undo
    this.gearStore._setGearSlotDirect(this.slot, this.newItem);
  }

  async undo() {
    // Don't record history during execute/undo
    this.gearStore._setGearSlotDirect(this.slot, this.previousItem);
  }
}

export class UnequipAllCommand {
  constructor(gearStore, previousGearSlots) {
    this.gearStore = gearStore;
    this.previousGearSlots = { ...previousGearSlots }; // Deep copy
    this.description = "Unequip all gear";
  }

  async execute() {
    // Don't record history during execute/undo
    this.gearStore._setAllGearSlotsDirect({});
  }

  async undo() {
    // Don't record history during execute/undo
    this.gearStore._setAllGearSlotsDirect(this.previousGearSlots);
  }
}

export class EquipMultipleCommand {
  constructor(gearStore, newGearSlots, previousGearSlots) {
    this.gearStore = gearStore;
    this.newGearSlots = { ...newGearSlots }; // Deep copy
    this.previousGearSlots = { ...previousGearSlots }; // Deep copy
    this.description = "Load gear set";
  }

  async execute() {
    // Don't record history during execute/undo
    await this.gearStore._equipMultipleDirect(this.newGearSlots);
  }

  async undo() {
    // Don't record history during execute/undo
    this.gearStore._setAllGearSlotsDirect(this.previousGearSlots);
  }
}
