import { toaster } from "@decky/api";
import {
  definePlugin,
  DropdownItem,
  PanelSection,
  PanelSectionRow,
  staticClasses,
  ToggleField,
} from "@decky/ui";
import { VFC } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import api from "./api";
import { Counter } from "./Components/Counter";
import { SETTINGS } from "./consts";
import { useSetting } from "./hooks/useSetting";
import { cloud } from "./icon";
import { GlobalQueryClient } from "./imported";

const Content: VFC = () => {
  const enabled = useSetting(SETTINGS.ENABLED, true);
  const notification = useSetting(SETTINGS.NOTIFICATION_ENABLED, true);
  const privacy = useSetting(SETTINGS.PRIVACY_STATE, FilePrivacyState.Private);
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
          <DropdownItem
            label="Default privacy state"
            menuLabel="Privacy state"
            rgOptions={[
              { label: "Private", data: FilePrivacyState.Private },
              { label: "Friends Only", data: FilePrivacyState.FriendsOnly },
              { label: "Public", data: FilePrivacyState.Public },
              { label: "Unlisted", data: FilePrivacyState.Unlisted },
            ]}
            selectedOption={privacy.value}
            onChange={(value) => privacy.update(value.data)}
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

function FilePrivacyStateToString(state: FilePrivacyState) {
  switch (state) {
    case FilePrivacyState.Private:
      return "Private";
    case FilePrivacyState.FriendsOnly:
      return "Friends Only";
    case FilePrivacyState.Public:
      return "Public";
    case FilePrivacyState.Unlisted:
      return "Unlisted";
  }
  return "Invalid";
}

export default definePlugin(() => {
  const register = SteamClient.GameSessions.RegisterForScreenshotNotification(
    async ({ hScreenshot, strOperation, unAppID }) => {
      const enabled = await api.getSetting({
        key: SETTINGS.ENABLED,
        defaults: true,
      });
      if (!enabled) return;
      const privacy = await api.getSetting({
        key: SETTINGS.PRIVACY_STATE,
        defaults: FilePrivacyState.Private,
      });
      try {
        if (strOperation === "written") {
          const res = await SteamClient.Screenshots.UploadLocalScreenshot(
            unAppID + "",
            hScreenshot,
            privacy
          );
          if (res) {
            try {
              // It doesn't work right now, I just keep this for reference
              (
                GlobalQueryClient.getQueryCache().find(
                  `screenshotdetails_local_${unAppID}_${hScreenshot}`
                ) ??
                GlobalQueryClient.getQueryCache().find([
                  "screenshots",
                  "screenshotdetails",
                  `local_${unAppID}_${hScreenshot}`,
                ])
              )?.invalidate();
            } catch {}
            await api.increaseCounter({ key: "all" });
            await LocalQueryClient.invalidateQueries(["counter", "all"]);
            const notification = await api.getSetting({
              key: SETTINGS.NOTIFICATION_ENABLED,
              defaults: true,
            });
            if (notification) {
              toaster.toast({
                title: "Screenshot uploaded",
                body: "Privacy State: " + FilePrivacyStateToString(privacy),
                icon: cloud,
                playSound: false,
              });
            }
          }
        }
      } catch (e) {
        toaster.toast({
          title: "Error",
          body: e + "",
          icon: cloud,
          playSound: false,
        });
        console.error(e);
      }
    }
  );
  return {
    title: <div className={staticClasses.Title}>Screenshot Uploader</div>,
    content: (
      <QueryClientProvider client={LocalQueryClient}>
        <Content />
      </QueryClientProvider>
    ),
    icon: cloud,
    onDismount() {
      register.unregister();
    },
  };
});
