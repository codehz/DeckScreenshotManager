import { findModuleChild } from "decky-frontend-lib";


export const GlobalQueryClient = findModuleChild(
  (x) => x?.ReactQueryClient
) as import("react-query").QueryClient;