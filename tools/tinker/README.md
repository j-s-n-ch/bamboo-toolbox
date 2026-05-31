# Walkscape Gear CLI Tinkerer

A CLI tool for simulating Walkscape skilling actions, gear stats, and drop rate probabilities using character save data.

## Requirements

1. Ensure the local backend server is running:
   ```bash
   cd backend
   npm run serve
   ```
   *Note: This starts the PostgreSQL container, seeds the database tags, and runs the server at `http://localhost:3001`.*

## Running the CLI Tool

Run the tool from the `frontend/` directory using `vite-node`:

```bash
cd frontend
npx vite-node ../tools/tinker/tinker.ts --help
```

### Examples

**List all available activities:**
```bash
npx vite-node ../tools/tinker/tinker.ts --list-activities
```

**List all available recipes:**
```bash
npx vite-node ../tools/tinker/tinker.ts --list-recipes
```

**Simulate a skilling activity (e.g., Mining Tin Ore):**
```bash
npx vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore
```

**Simulate a recipe craft (e.g., Tin Bar):**
```bash
npx vite-node ../tools/tinker/tinker.ts --recipe tin_bar
```

**Simulate with a custom character save file:**
```bash
npx vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore --save /path/to/character_save.json
```

**Simulate with a custom gearset share code or file path:**
```bash
# Pass the raw base64 share code
npx vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore --gearset-code <base64_share_code>

# Or pass a file path containing the base64 code (avoids terminal shell limits)
npx vite-node ../tools/tinker/tinker.ts --activity mine_tin_ore --gearset-code ../scratch/case5_gearset.txt
```
*Note: This will override the equipped gear from the save file with the gear defined in the exported gearset code, mapping old database IDs to current game item IDs.*

**Simulate at a custom location or service station:**
```bash
# Override the location (e.g. simulate branch trimming in Mangrove Forest)
npx vite-node ../tools/tinker/tinker.ts --activity branch_trimming --location mangrove_forest

# Override the service station
npx vite-node ../tools/tinker/tinker.ts --recipe smelt_a_steel_bar --service cursed_sawmill_advanced
```

## Features
- **Predictable Default Locations**: If an activity is available in multiple places, the tool automatically lists alternative locations and defaults alphabetically by ID to guarantee deterministic simulations.
- **Requirements Check**: Validates the character against the requirements of the simulated activity/recipe (such as equipping a tool with the `pickaxe` keyword for mining, or requiring `diving_gear` keywords for underwater services).
- **Modifier Calculations**: Computes capped work efficiency, steps per completion, and double action/reward chances.
- **Expected Yields**: Estimates XP, Gold, and Faction Tokens per 1k steps.
- **Detailed Drop Table**: Lists drop chances, steps per item, and steps per fine quality outcome for all items in the loot table.

