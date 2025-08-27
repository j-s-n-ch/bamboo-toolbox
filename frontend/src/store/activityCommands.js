export class SetActivityCommand {
  constructor(
    activityStore,
    newActivity,
    previousActivity = null,
    previousRecipe = null,
    previousLocation = null,
    previousLocations = null
  ) {
    this.activityStore = activityStore;
    this.newActivity = newActivity;
    this.previousActivity = previousActivity;
    this.previousRecipe = previousRecipe;
    this.previousLocation = previousLocation;
    this.previousLocations = previousLocations;
    this.description = newActivity
      ? `Select activity: ${newActivity.name}`
      : `Clear activity`;
  }

  async execute() {
    // Don't record history during execute/undo
    this.activityStore._setActivityDirect(this.newActivity);

    // Load activity locations if we have an activity
    if (this.newActivity && this.newActivity.id !== "none") {
      await this.activityStore.loadActivityLocations(this.newActivity.id);
    } else {
      this.activityStore._setLocationsDirect(null);
      this.activityStore._setLocationDirect(null);
    }
  }

  async undo() {
    // Don't record history during execute/undo
    // Set undo flag to prevent auto-selection
    this.activityStore._isUndoRedoOperation = true;

    try {
      if (this.previousActivity) {
        this.activityStore._setActivityDirect(this.previousActivity);
        this.activityStore._setLocationsDirect(this.previousLocations);
        this.activityStore._setLocationDirect(this.previousLocation);
      } else if (this.previousRecipe) {
        this.activityStore._setRecipeDirect(this.previousRecipe);
        this.activityStore._setLocationsDirect(this.previousLocations);
        this.activityStore._setLocationDirect(this.previousLocation);
      }
    } finally {
      // Always clear the undo flag
      this.activityStore._isUndoRedoOperation = false;
    }
  }
}

export class SetRecipeCommand {
  constructor(
    activityStore,
    newRecipe,
    previousActivity = null,
    previousRecipe = null,
    previousLocation = null,
    previousLocations = null,
    previousService = null,
    previousServices = null
  ) {
    this.activityStore = activityStore;
    this.newRecipe = newRecipe;
    this.previousActivity = previousActivity;
    this.previousRecipe = previousRecipe;
    this.previousLocation = previousLocation;
    this.previousLocations = previousLocations;
    this.previousService = previousService;
    this.previousServices = previousServices;
    this.description = newRecipe
      ? `Select recipe: ${newRecipe.name}`
      : `Clear recipe`;
  }

  async execute() {
    // Don't record history during execute/undo
    this.activityStore._setRecipeDirect(this.newRecipe);

    // Load recipe services if we have a recipe
    if (this.newRecipe && this.newRecipe.id !== "none") {
      const [skill] = this.newRecipe.relatedSkills || [null];
      const recipeRequirement = this.newRecipe.requirements
        ?.map(({ requirement }) => requirement)
        ?.find((req) => req.runtimeType === "service");
      await this.activityStore.loadRecipeServices(skill, recipeRequirement);
    } else {
      this.activityStore._setServicesDirect([]);
      this.activityStore._setServiceDirect(null);
      this.activityStore._setLocationsDirect(null);
      this.activityStore._setLocationDirect(null);
    }
  }

  async undo() {
    // Don't record history during execute/undo
    // Set undo flag to prevent auto-selection
    this.activityStore._isUndoRedoOperation = true;

    try {
      if (this.previousRecipe) {
        this.activityStore._setRecipeDirect(this.previousRecipe);
        this.activityStore._setServicesDirect(this.previousServices);
        this.activityStore._setServiceDirect(this.previousService);
        this.activityStore._setLocationsDirect(this.previousLocations);
        this.activityStore._setLocationDirect(this.previousLocation);
      } else if (this.previousActivity) {
        this.activityStore._setActivityDirect(this.previousActivity);
        this.activityStore._setLocationsDirect(this.previousLocations);
        this.activityStore._setLocationDirect(this.previousLocation);
      }
    } finally {
      // Always clear the undo flag
      this.activityStore._isUndoRedoOperation = false;
    }
  }
}

export class SetLocationCommand {
  constructor(activityStore, newLocation, previousLocation = null) {
    this.activityStore = activityStore;
    this.newLocation = newLocation;
    this.previousLocation = previousLocation;
    this.description = newLocation
      ? `Select location: ${newLocation.name}`
      : `Clear location`;
  }

  async execute() {
    // Don't record history during execute/undo
    this.activityStore._setLocationDirect(this.newLocation);
  }

  async undo() {
    // Don't record history during execute/undo
    // Set undo flag to prevent auto-selection
    this.activityStore._isUndoRedoOperation = true;

    try {
      this.activityStore._setLocationDirect(this.previousLocation);
    } finally {
      // Always clear the undo flag
      this.activityStore._isUndoRedoOperation = false;
    }
  }
}

export class SetServiceCommand {
  constructor(
    activityStore,
    newService,
    previousService = null,
    previousLocation = null,
    previousLocations = null
  ) {
    this.activityStore = activityStore;
    this.newService = newService;
    this.previousService = previousService;
    this.previousLocation = previousLocation;
    this.previousLocations = previousLocations;
    this.description = newService
      ? `Select service: ${newService.name}`
      : `Clear service`;
  }

  async execute() {
    // Don't record history during execute/undo
    this.activityStore._setServiceDirect(this.newService);

    // Load service locations if we have a service
    if (this.newService) {
      await this.activityStore.loadServiceLocations(this.newService.id);
    } else {
      this.activityStore._setLocationsDirect(null);
      this.activityStore._setLocationDirect(null);
    }
  }

  async undo() {
    // Don't record history during execute/undo
    // Set undo flag to prevent auto-selection
    this.activityStore._isUndoRedoOperation = true;

    try {
      // Restore the previous state
      this.activityStore._setServiceDirect(this.previousService);
      this.activityStore._setLocationsDirect(this.previousLocations);
      this.activityStore._setLocationDirect(this.previousLocation);
    } finally {
      // Always clear the undo flag
      this.activityStore._isUndoRedoOperation = false;
    }
  }
}
