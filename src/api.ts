import { call } from "@decky/api";

export interface ServerAPIType {
  getSetting<T>(args: { key: string; defaults?: T }): Promise<T>;
  putSetting<T>(args: { key: string; value: T }): Promise<void>;
  increaseCounter(args: { key: string }): Promise<void>;
  getCounter(args: { key: string }): Promise<number>;
}

export default new Proxy(call, {
  get(obj: any, key: string) {
    return obj[key] ?? ((args: any = {}) => call<any[], any>(key, ...args));
  },
}) as ServerAPIType & typeof call;
