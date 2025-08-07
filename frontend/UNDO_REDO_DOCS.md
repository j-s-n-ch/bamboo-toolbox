# Undo/Redo System Documentation

## Overview

The undo/redo system is built using the Command Pattern, which records actions and their inverse operations instead of storing entire state snapshots. This makes it more memory-efficient and flexible.

## Architecture

### Core Components

1. **History Store** (`src/store/history.js`)
   - Manages the command history stack
   - Provides undo/redo functionality
   - Tracks current position in history

2. **Gear Commands** (`src/store/gearCommands.js`)
   - `EquipItemCommand`: Equip/unequip a single item
   - `UnequipAllCommand`: Unequip all gear with restoration
   - `EquipMultipleCommand`: Load entire gear sets

3. **Gear Store Integration** (`src/store/gear.js`)
   - Modified to use command pattern
   - Automatic history recording for all gear changes

4. **UI Components**
   - `UndoRedoButtons.vue`: Interactive buttons for mobile/desktop
   - `HistoryDebug.vue`: Development panel for debugging
   - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)

## How It Works

### Command Structure
Each command contains:
- `execute()`: Performs the action
- `undo()`: Reverses the action
- `description`: Human-readable description

### Example: Equipping an Item
```javascript
// When user equips an item
const command = new EquipItemCommand(gearStore, 'head', newHelmet, previousHelmet);

// Execute the command (equips the item)
await command.execute();

// Later, undo restores the previous item
await command.undo();
```

## Usage

### For Users
- **Desktop**: Use Ctrl+Z to undo, Ctrl+Shift+Z to redo
- **Mobile**: Use the undo/redo buttons in the gear tab
- All gear changes are automatically tracked

### For Developers

#### Adding New Commands
1. Create a new command class in `gearCommands.js`:
```javascript
export class MyCommand {
  constructor(store, data, previousData) {
    this.store = store;
    this.data = data;
    this.previousData = previousData;
    this.description = "My action description";
  }

  async execute() {
    // Perform the action
    this.store._myDirectMethod(this.data);
  }

  async undo() {
    // Reverse the action
    this.store._myDirectMethod(this.previousData);
  }
}
```

2. Use it in your store:
```javascript
async myAction(data) {
  const previousData = this.getCurrentData();
  const command = new MyCommand(this, data, previousData);
  await this._executeCommand(command);
}
```

#### Key Principles
- Always capture the previous state before making changes
- Use direct methods (prefixed with `_`) within commands to avoid infinite loops
- Commands should be self-contained and reversible

## Features

### Current Implementation
- ✅ Equip/unequip individual items
- ✅ Unequip all gear
- ✅ Load gear sets
- ✅ Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- ✅ Mobile-friendly buttons
- ✅ History size limiting (50 commands by default)
- ✅ Debug panel for development

### Future Extensions
- Add undo/redo for other store changes (settings, filters, etc.)
- Batch operations with single undo
- History persistence across sessions
- Custom keyboard shortcuts

## Configuration

### History Size
```javascript
// In history store
maxHistorySize: 50, // Adjust as needed
```

### Keyboard Shortcuts
Edit `useUndoRedoShortcuts.js` to customize shortcuts:
```javascript
if (isCtrlOrCmd && event.key === "z") {
  // Your custom undo logic
}
```

## Debugging

Use the History Debug panel (available in development) to:
- View command history
- See current position
- Test undo/redo operations
- Clear history for testing

## Performance Notes

- Commands store minimal data (only what changed)
- No deep copying of entire state
- Lazy loading of history store prevents circular dependencies
- History is automatically trimmed when it exceeds the limit

## Error Handling

The system gracefully handles:
- Missing history store (optional dependency)
- Failed command execution
- Invalid command structures
- Store initialization errors

All errors are logged to console but don't break the application.
