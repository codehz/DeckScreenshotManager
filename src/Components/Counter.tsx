import { Field } from "@decky/ui";
import { VFC } from "react";
import { useQuery } from "react-query";
import api from "../api";

export const Counter: VFC<{ label: string; field: string }> = ({
  label,
  field: key,
}) => {
  const { data, isLoading } = useQuery(["counter", key], () =>
    api.getCounter({ key })
  );
  return (
    <Field label={label} focusable>
      {isLoading ? "Loading..." : data + ""}
    </Field>
  );
};
