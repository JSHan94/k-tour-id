export const ONDO_B_THEME_CHANGE_EVENT = "ondo:theme-change"

export type OndoBAppearancePreference = "system" | "light" | "dark"
export type OndoBResolvedAppearance = "light" | "dark"
export type OndoBAppearanceSnapshot = {
  preference: OndoBAppearancePreference
  theme: OndoBResolvedAppearance
}

export const DEFAULT_ONDO_B_APPEARANCE: OndoBAppearancePreference = "system"
export const ONDO_B_DEVICE_STORAGE_KEY = "ondo-b.device.v1"

export function sanitizeOndoBAppearancePreference(value: unknown): OndoBAppearancePreference {
  return value === "light" || value === "dark" ? value : DEFAULT_ONDO_B_APPEARANCE
}

export function resolveOndoBAppearance(
  preference: OndoBAppearancePreference,
  systemPrefersDark: boolean,
): OndoBResolvedAppearance {
  return preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference
}

export function browserPrefersDarkAppearance() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Read only the appearance field from the shared device record. This path is
 * intentionally smaller than full provider hydration so it is safe to run in
 * a layout effect when an SPA navigation remounts ONDO after document cleanup.
 */
export function readOndoBAppearanceSnapshot(
  storage: Pick<Storage, "getItem">,
  systemPrefersDark: boolean,
): OndoBAppearanceSnapshot {
  let preference: OndoBAppearancePreference = DEFAULT_ONDO_B_APPEARANCE
  try {
    const raw = storage.getItem(ONDO_B_DEVICE_STORAGE_KEY)
    const parsed = raw === null ? null : JSON.parse(raw)
    const value = parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>).appearancePreference
      : null
    preference = sanitizeOndoBAppearancePreference(value)
  } catch {
    // Storage and malformed records both resolve to the same safe system mode
    // used by the pre-paint bootstrap.
  }
  return { preference, theme: resolveOndoBAppearance(preference, systemPrefersDark) }
}

export function readBrowserOndoBAppearanceSnapshot(): OndoBAppearanceSnapshot {
  const systemPrefersDark = browserPrefersDarkAppearance()
  if (typeof window === "undefined") {
    return { preference: DEFAULT_ONDO_B_APPEARANCE, theme: resolveOndoBAppearance(DEFAULT_ONDO_B_APPEARANCE, systemPrefersDark) }
  }
  try {
    return readOndoBAppearanceSnapshot(window.localStorage, systemPrefersDark)
  } catch {
    return { preference: DEFAULT_ONDO_B_APPEARANCE, theme: resolveOndoBAppearance(DEFAULT_ONDO_B_APPEARANCE, systemPrefersDark) }
  }
}

export function syncOndoBAppearanceDocument(
  preference: OndoBAppearancePreference,
  theme: OndoBResolvedAppearance,
) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.dataset.ondoThemePreference = preference
  root.dataset.ondoTheme = theme
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme

  let themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!themeColor) {
    themeColor = document.createElement("meta")
    themeColor.name = "theme-color"
    document.head.append(themeColor)
  }
  themeColor.content = theme === "dark" ? "#111214" : "#ffffff"

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ONDO_B_THEME_CHANGE_EVENT, { detail: { theme } }))
  }
}

/**
 * The ONDO product owns the document theme only while its provider is mounted.
 * Reset the shared layout to its neutral server defaults on a client-side route
 * exit so another surface cannot inherit ONDO's persisted dark preference.
 */
export function resetOndoBAppearanceDocument() {
  if (typeof document === "undefined") return
  const root = document.documentElement
  delete root.dataset.ondoThemePreference
  delete root.dataset.ondoTheme
  root.classList.remove("dark")
  root.style.removeProperty("color-scheme")

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = "#ffffff"

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ONDO_B_THEME_CHANGE_EVENT, { detail: { theme: "light" } }))
  }
}

/**
 * Runs before the app paints so a returning explicit preference, or the current
 * system preference, owns the very first frame. The provider repeats the same
 * synchronization after hydration and on live system changes.
 */
export const ONDO_B_APPEARANCE_BOOTSTRAP_SCRIPT = String.raw`(() => {
  if (!(location.pathname === "/" || /^\/ondo-b(?:\/|$)/.test(location.pathname))) return;
  let preference = "system";
  try {
    const raw = localStorage.getItem("${ONDO_B_DEVICE_STORAGE_KEY}");
    const value = raw === null ? null : JSON.parse(raw).appearancePreference;
    if (value === "light" || value === "dark") preference = value;
  } catch {}
  const systemDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = preference === "system" ? (systemDark ? "dark" : "light") : preference;
  const root = document.documentElement;
  root.dataset.ondoThemePreference = preference;
  root.dataset.ondoTheme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = theme === "dark" ? "#111214" : "#ffffff";
})();`
