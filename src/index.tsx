import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
} from "decky-frontend-lib";
import { VFC } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { proxyServerAPI, ServerAPIContext, ServerAPIType } from "./api";
import { Counter } from "./Components/Counter";
import { useSetting } from "./hooks/useSetting";
import { icon } from "./icon";
import { GlobalQueryClient } from "./imported";
import { SETTINGS } from "./consts";

const Content: VFC = () => {
  const enabled = useSetting(SETTINGS.ENABLED, true);
  const notification = useSetting(SETTINGS.NOTIFICATION_ENABLED, true);
  return (
    <>
      <PanelSection title="settings">
        <PanelSectionRow>
          <ToggleField
            checked={enabled.value}
            disabled={enabled.isLoading}
            label="Enabled"
            onChange={(value) => enabled.update(value)}
          />
          <ToggleField
            checked={notification.value}
            disabled={notification.isLoading}
            label="Notification"
            onChange={(value) => notification.update(value)}
          />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="counter">
        <PanelSectionRow>
          <Counter label="Upload count" field="all" />
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};

declare global {
  const enum FilePrivacyState {
    Invalid = -1,
    Private = 2,
    FriendsOnly = 4,
    Public = 8,
    Unlisted = 16,
  }
  interface Screenshot {
    nAppID: number;
    strGameID: string;
    hHandle: number;
    nWidth: number;
    nHeight: number;
    nCreated: number; // timestamp
    ePrivacy: FilePrivacyState;
    strCaption: "";
    bSpoilers: boolean;
    strUrl: string;
    bUploaded: boolean;
    ugcHandle: string;
  }
  interface Screenshots {
    GetLocalScreenshot(): Promise<Screenshot[]>;
    UploadLocalScreenshot(
      appId: string,
      hHandle: number,
      filePrivacyState: FilePrivacyState
    ): Promise<boolean>;
  }
  interface Unregisterable {
    unregister(): void;
  }
  interface ScreenshotNotification {
    details?: Screenshot;
    hScreenshot: number;
    strOperation: "written" | "deleted" | (string & {});
    unAppID: number;
  }
  interface GameSessions {
    RegisterForScreenshotNotification(
      callback: (screenshotNotification: ScreenshotNotification) => void
    ): Unregisterable;
  }
  interface Apps {}
  interface SteamClient {
    Screenshots: Screenshots;
    GameSessions: GameSessions;
  }
  var SteamClient: SteamClient;
}

const LocalQueryClient = new QueryClient();

export default definePlugin((serverApi: ServerAPI) => {
  const proxy = proxyServerAPI<ServerAPIType>(serverApi);
  const register = SteamClient.GameSessions.RegisterForScreenshotNotification(
    async ({ hScreenshot, strOperation, unAppID, details }) => {
      const enabled = await proxy.getSetting({
        key: SETTINGS.ENABLED,
        defaults: true,
      });
      if (!enabled) return;
      try {
        if (strOperation === "written") {
          const res = await SteamClient.Screenshots.UploadLocalScreenshot(
            unAppID + "",
            hScreenshot,
            FilePrivacyState.Private
          );
          if (res) {
            GlobalQueryClient.getQueryCache()
              .find(`screenshotdetails_local_${unAppID}_${hScreenshot}`)
              ?.invalidate();
            await proxy.increaseCounter({ key: "all" });
            await LocalQueryClient.invalidateQueries(["counter", "all"]);
            const notification = await proxy.getSetting({
              key: SETTINGS.NOTIFICATION_ENABLED,
              defaults: true,
            });
            if (notification) {
              serverApi.toaster.toast({
                title: "Screenshot uploaded",
                body: details!.strUrl + "",
                icon,
                playSound: false,
              });
            }
          }
        }
      } catch (e) {
        serverApi.toaster.toast({
          title: "Error",
          body: e + "",
          icon,
          playSound: false,
        });
        console.error(e);
      }
    }
  );
  return {
    title: <div className={staticClasses.Title}>Screenshot Uploader</div>,
    content: (
      <ServerAPIContext.Provider value={proxy}>
        <QueryClientProvider client={LocalQueryClient}>
          <Content />
        </QueryClientProvider>
      </ServerAPIContext.Provider>
    ),
    icon,
    onDismount() {
      register.unregister();
    },
  };
});
