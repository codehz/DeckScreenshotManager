import { Field } from "decky-frontend-lib";
import { VFC, useContext } from "react";
import { useQuery } from "react-query";
import { ServerAPIContext } from "../api";

export const Counter: VFC<{ label: string; field: string }> = ({
  label,
  field: key,
}) => {
  const serverAPI = useContext(ServerAPIContext);
  const { data, isLoading } = useQuery(["counter", key], () =>
    serverAPI.getCounter({ key })
  );
  console.log({ data, key });
  return (
    <Field label={label} focusable>
      {isLoading ? "Loading..." : data + ''}
    </Field>
  );
};
