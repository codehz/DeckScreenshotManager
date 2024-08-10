import { toaster } from "@decky/api";
import { useMutation, useQuery, useQueryClient } from "react-query";
import api from "../api";

export const useSetting = <T>(key: string, defaults: T) => {
  const { data = defaults, isLoading } = useQuery(["settings", key], () =>
    api.getSetting<T>({
      key,
      defaults,
    })
  );
  const client = useQueryClient();
  const mutate = useMutation(
    async (value: T) => {
      await api.putSetting({
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
        toaster.toast({
          title: "Error",
          body: err + "",
        });
        client.setQueryData(["settings", key], context?.old ?? defaults);
      },
    }
  );
  return { value: data, isLoading, update: mutate.mutate };
};
