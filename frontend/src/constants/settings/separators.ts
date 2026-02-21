import { SettingOption } from "./types";

export const thousandSeparators: SettingOption[] = [
  { value: " ", name: "Space ( )" },
  { value: "'", name: "Apostrophe (')" },
  { value: ".", name: "Point (.)" },
  { value: ",", name: "Comma (,)" },
];

export const decimalSeparators: SettingOption[] = [
  { value: ".", name: "Point (.)" },
  { value: ",", name: "Comma (, )" },
];

export default {
  thousandSeparators,
  decimalSeparators,
};
