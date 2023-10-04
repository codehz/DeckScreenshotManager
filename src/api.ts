import { ServerAPI } from "decky-frontend-lib";
import { createContext } from "react";

export interface ServerAPIType {
  getSetting<T>(args: { key: string; defaults?: T }): Promise<T>;
  putSetting<T>(args: { key: string; value: T }): Promise<void>;
  increaseCounter(args: { key: string }): Promise<void>;
  getCounter(args: { key: string }): Promise<number>;
}

export function proxyServerAPI<T>(api: ServerAPI) {
  return new Proxy(api, {
    get(obj: any, key: string) {
      return (
        obj[key] ??
        (async (args: any = {}) => {
          const response = await api.callPluginMethod(key, args);
          console.log({ key, args, response });
          if (response.success) {
            return response.result;
          } else throw new Error("Failed to call plugin method " + key);
        })
      );
    },
  }) as ServerAPI & Exclude<T, keyof ServerAPI>;
}

export const ServerAPIContext = createContext<ServerAPI & ServerAPIType>(
  {} as never
);
