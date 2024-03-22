import { findModuleChild } from "decky-frontend-lib";

export const GlobalQueryClient: import("react-query").QueryClient =
  findModuleChild((x) => x?.ReactQueryClient) ??
  findModuleChild((x) => {
    if (typeof x !== "object") return null;
    const entries = Object.entries(x);
    if (entries.length !== 2) return null;
    if (entries.some(([k]) => k.length !== 1)) return null;
    const fnIdx = entries.findIndex(
      ([, v]) => typeof v === "function" && v.toString().includes("React-Query")
    );
    if (fnIdx === -1) return null;
    return entries[1 - fnIdx][1];
  });
