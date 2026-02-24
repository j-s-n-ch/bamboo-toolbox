<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update-setting-value", "update-setting-display"]);

function updateSettingValue(key, value) {
  emit("update-setting-value", key, value);
}

function updateSettingDisplay(key, display) {
  const isBool = typeof display === "boolean";
  const displayValue = isBool ? (display ? 1 : 0) : display;
  emit("update-setting-display", key, displayValue);
}

/**
 * Settings with both an enable toggle and a "Visible in UI" toggle.
 * Created by makeBoolSetting — no displayOptions, showEnable/showDisplay not overridden.
 */
const toggleWithVisibilitySettings = computed(() =>
  Object.entries(props.settings).filter(
    ([, s]) =>
      !s.displayOptions &&
      !("showEnable" in s && !s.showEnable) &&
      !("showDisplay" in s && !s.showDisplay),
  ),
);

/**
 * Settings that only expose a dropdown (no enable checkbox).
 * Created by makeDisplaySetting — has displayOptions and showEnable: false.
 */
const dropdownSettings = computed(() =>
  Object.entries(props.settings).filter(
    ([, s]) => s.displayOptions && "showEnable" in s && !s.showEnable,
  ),
);

/**
 * Settings with only an enable toggle and no display column.
 * Created by makeDebugSetting — has showDisplay: false.
 */
const toggleOnlySettings = computed(() =>
  Object.entries(props.settings).filter(
    ([, s]) => "showDisplay" in s && !s.showDisplay,
  ),
);
</script>

<template>
  <div class="settings-table-container">
    <h3>{{ title }}</h3>

    <!-- Toggle + Visible in UI -->
    <table
      v-if="toggleWithVisibilitySettings.length"
      class="settings-table"
    >
      <thead>
        <tr>
          <th>Setting</th>
          <th>Enabled (Default)</th>
          <th>Visible in UI</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, setting] in toggleWithVisibilitySettings" :key="key">
          <td class="setting-label">{{ setting.label }}</td>
          <td class="setting-enabled">
            <input
              type="checkbox"
              :id="`${key}-value`"
              :checked="setting.value"
              @change="updateSettingValue(key, $event.target.checked)"
            />
          </td>
          <td class="setting-display">
            <input
              type="checkbox"
              :id="`${key}-display`"
              :checked="setting.display === 1"
              @change="updateSettingDisplay(key, $event.target.checked)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Dropdown-only -->
    <table
      v-if="dropdownSettings.length"
      class="settings-table"
      :class="{ 'mt-table': toggleWithVisibilitySettings.length }"
    >
      <thead>
        <tr>
          <th>Setting</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, setting] in dropdownSettings" :key="key">
          <td class="setting-label">{{ setting.label }}</td>
          <td class="setting-display">
            <select
              :id="`${key}-display`"
              :value="setting.display"
              @change="updateSettingDisplay(key, parseInt($event.target.value))"
            >
              <option
                v-for="(option, idx) in setting.displayOptions"
                :key="option.value || option.name || idx"
                :value="idx"
              >
                {{ option.name || option }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Toggle-only (no display column) -->
    <table
      v-if="toggleOnlySettings.length"
      class="settings-table"
      :class="{ 'mt-table': toggleWithVisibilitySettings.length || dropdownSettings.length }"
    >
      <thead>
        <tr>
          <th>Setting</th>
          <th>Enabled</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[key, setting] in toggleOnlySettings" :key="key">
          <td class="setting-label">{{ setting.label }}</td>
          <td class="setting-enabled">
            <input
              type="checkbox"
              :id="`${key}-value`"
              :checked="setting.value"
              @change="updateSettingValue(key, $event.target.checked)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.settings-table-container {
  h3 {
    margin: 0 0 $base 0;
    color: $txPrimary;
  }

  .mt-table {
    margin-top: $base;
  }
}

.settings-table {
  width: 100%;
  border-collapse: collapse;
  background: $bgPrimary;
  border-radius: $sm;
  overflow: hidden;
  border: 1px solid $boxDarkOutline;

  thead {
    background: $boxDarkBackground;

    th {
      padding: $sm $base;
      text-align: center;
      font-weight: bold;
      color: $txPrimary;
      border-bottom: 1px solid $boxDarkOutline;

      &:not(:last-child) {
        border-right: 1px solid $boxDarkOutline;
      }
    }
  }

  tbody {
    tr {
      &:nth-child(even) {
        background: rgba(255, 255, 255, 0.02);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      &:not(:last-child) td {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
    }

    td {
      padding: $sm $base;
      color: $txPrimary;

      &:not(:last-child) {
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }

      &.setting-label {
        font-weight: 500;
        width: 60%;
      }

      &.setting-enabled,
      &.setting-display {
        text-align: center;
        width: 20%;
      }
    }
  }

  input[type="checkbox"] {
    cursor: pointer;
    transform: scale(1.1);

    &:focus {
      outline: 2px solid var(--color-primary, $txPrimary);
      outline-offset: 2px;
    }
  }

  select {
    background: $bgPrimary;
    color: $txPrimary;
    border: 1px solid $boxDarkOutline;
    border-radius: $xs;
    padding: $xs $sm;
    cursor: pointer;
    font-size: inherit;
    max-width: 100%;

    &:focus {
      outline: 2px solid var(--color-primary, $txPrimary);
      outline-offset: 2px;
      border-color: var(--color-primary, $txPrimary);
    }

    option {
      background: $bgPrimary;
      color: $txPrimary;
    }
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .settings-table {
    font-size: 14px;

    thead th {
      padding: $xs $sm;
    }

    tbody td {
      padding: $xs $sm;

      &.setting-label {
        width: 50%;
        word-break: break-word;
      }

      &.setting-enabled,
      &.setting-display {
        width: 25%;
      }
    }

    select {
      padding: $xs;
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .settings-table {
    font-size: 13px;

    tbody td {
      &.setting-label {
        font-size: 12px;
        line-height: 1.3;
      }
    }
  }
}

// Screen reader only class for accessibility
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
