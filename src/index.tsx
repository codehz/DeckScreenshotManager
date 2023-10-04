import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
} from "decky-frontend-lib";
import { useContext, VFC } from "react";

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { proxyServerAPI, ServerAPIContext, ServerAPIType } from "./api";
import { Counter } from "./Components/Counter";
import { icon } from "./icon";
import { GlobalQueryClient } from "./imported";

const Content: VFC = () => {
  const serverAPI = useContext(ServerAPIContext);
  const { data: enabled = true, isLoading } = useQuery(
    "decky-screenshots-enabled",
    () =>
      serverAPI.getSetting<boolean>({
        key: "enabled",
        defaults: true,
      })
  );
  const client = useQueryClient();
  const mutate = useMutation(
    async (value: boolean) => {
      await serverAPI.putSetting({
        key: "enabled",
        value,
      });
    },
    {
      onMutate(data) {
        const old = client.getQueryData("decky-screenshots-enabled");
        client.setQueryData("decky-screenshots-enabled", data);
        return { old };
      },
      onError(err, _data, context) {
        serverAPI.toaster.toast({
          title: "Error",
          body: err + "",
        });
        client.setQueryData("decky-screenshots-enabled", context?.old ?? true);
      },
    }
  );
  return (
    <>
      <PanelSection title="settings">
        <PanelSectionRow>
          <ToggleField
            checked={enabled}
            disabled={isLoading}
            label="Enabled"
            onChange={(value) => mutate.mutate(value)}
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
      console.log(hScreenshot, strOperation, unAppID, details);
      const enabled = await proxy.getSetting({
        key: "enabled",
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
            serverApi.toaster.toast({
              title: "Screenshot uploaded",
              body: details!.strUrl + "",
              icon,
              playSound: false,
            });
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
