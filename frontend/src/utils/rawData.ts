/**
 * Utility functions for handling raw data and objects in Vue.js.
 *
 * Functions:
 * - `isObject(value)`: Checks if the provided value is a non-null object (excluding arrays).
 * - `getRawData(data)`: Returns the raw data if the input is reactive, otherwise returns the input as is.
 * - `toDeepRaw(data)`: Recursively converts a reactive object and its nested properties to their raw counterparts, returning a deep clone of the result.
 *
 */

import { isReactive, toRaw } from "vue";

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === "object";
}

export function getRawData<T>(data: T): T {
  return isReactive(data) ? toRaw(data) : data;
}

export function toDeepRaw<T>(data: T): T {
  const rawData = getRawData(data);

  for (const key in rawData as Record<string, unknown>) {
    const value = (rawData as Record<string, unknown>)[key];

    if (!isObject(value) && !Array.isArray(value)) {
      continue;
    }

    (rawData as Record<string, unknown>)[key] = toDeepRaw(value);
  }

  return structuredClone(rawData);
}
