import { toTags } from "./to-tags";

describe("toTags", () => {
  it("should handle when an array is passed in by recursing it", () => {
    const result = toTags(["some", "tag", "array"]);

    expect(result).toEqual({ 0: "some", 1: "tag", 2: "array" });
  });

  it("should handle nulls", () => {
    const result = toTags({ test: null });

    expect(result).toEqual({});
  });

  it("should produce a tag for each key of an object that is a single depth", () => {
    const result = toTags({ key1: "value1", key2: 2, key3: false, key4: null });

    expect(result).toEqual({ key1: "value1", key2: 2, key3: false });
  });

  it("should produce a tag for an array that is nested within an object", () => {
    const result = toTags({ key1: ["some", "array", "tag"] });

    expect(result).toEqual({ "key1.0": "some", "key1.1": "array", "key1.2": "tag" });
  });

  it("should recurse when object is nested", () => {
    const result = toTags({ key1: "value1", key2: { nestedKey: "value2" } });

    expect(result).toEqual({
      key1: "value1",
      "key2.nestedKey": "value2",
    });
  });

  it("should really recurse when object is super nested", () => {
    const result = toTags({
      key1: "value1",
      key2: {
        nestedKey: "value2",
        nestingEvenMore: { gettingVeryNested: { dearLordImNested: { nestedMoreThanABird: "value3" } } },
      },
    });

    expect(result).toEqual({
      key1: "value1",
      "key2.nestedKey": "value2",
      "key2.nestingEvenMore.gettingVeryNested.dearLordImNested.nestedMoreThanABird": "value3",
    });
  });
});
