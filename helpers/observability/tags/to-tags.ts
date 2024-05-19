import { Tag, TagRecord } from "./tag";

export const toTags = (value: TagRecord): Record<string, Tag> => {
  return Object.entries(value).reduce(
    (acc, [key, val]) => {
      if (val == null) return acc;

      if (typeof val === "object") {
        const tags = Object.fromEntries(Object.entries(toTags(val)).map(([k, v]) => [`${key}.${k}`, v]));

        return { ...acc, ...tags };
      }

      return { ...acc, [key]: val };
    },
    {} as Record<string, Tag>,
  );
};
