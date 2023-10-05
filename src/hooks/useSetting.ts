import { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ServerAPIContext } from "../api";

export const useSetting = <T>(key: string, defaults: T) => {
  const serverAPI = useContext(ServerAPIContext);
  const { data = defaults, isLoading } = useQuery(["settings", key], () =>
    serverAPI.getSetting<T>({
      key,
      defaults,
    })
  );
  const client = useQueryClient();
  const mutate = useMutation(
    async (value: T) => {
      await serverAPI.putSetting({
        key,
        value,
      });
    },
    {
      onMutate(data) {
        const old = client.getQueryData(["settings", key]);
        client.setQueryData(["settings", key], data);
        return { old };
      },
      onError(err, _data, context) {
        serverAPI.toaster.toast({
          title: "Error",
          body: err + "",
        });
        client.setQueryData(["settings", key], context?.old ?? defaults);
      },
    }
  );
  return { value: data, isLoading, update: mutate.mutate };
};
