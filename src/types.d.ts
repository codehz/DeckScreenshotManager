declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare interface Window {
  appActivityStore: {
    readonly CMInterface: any;
    GetAppActivity(unAppID: number): any;
    RestoreActivity(unAppID: number): Promise<void>;
    FetchLatestActivity(unAppID: number, cache?: boolean): Promise<void>;
    FetchActivityHistory(unAppID: number, cache?: boolean): Promise<void>;
  };
}
