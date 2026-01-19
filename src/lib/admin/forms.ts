import type { LocalizedString } from "@/types/content";

export function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

export function readNumber(formData: FormData, key: string) {
  const value = readString(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function readList(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function cleanI18n(input: LocalizedString) {
  const next: LocalizedString = {};
  if (input.vi?.trim()) next.vi = input.vi.trim();
  if (input.en?.trim()) next.en = input.en.trim();
  return Object.keys(next).length ? next : undefined;
}
