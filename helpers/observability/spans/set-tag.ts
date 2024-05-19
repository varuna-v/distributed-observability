import tracer from "dd-trace";

import { Tag, TagRecord } from "../tags/tag";
import { toTags } from "../tags/to-tags";

export const setTag = ({ name, value }: { name: string; value: Tag | TagRecord }) => {
  const span = tracer.scope().active();

  if (!span) {
    throw new Error("No active span found");
  }

  const tags = toTags({ [name]: value });

  Object.entries(tags).forEach(([tagKey, tagValue]) => {
    span.setTag(`context.${tagKey}`, tagValue);
  });
};
