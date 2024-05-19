export type Tag = string | number | boolean | null | undefined;

export type TagRecord = Tag[] | { [s: string]: Tag | TagRecord };
