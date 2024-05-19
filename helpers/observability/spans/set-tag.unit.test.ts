import tracer, { Scope, Span } from "dd-trace";
import { vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { toTags } from "../tags/to-tags";
import { setTag } from "./set-tag";

vi.mock("../tags/to-tags");

describe("setTag", () => {
  let scopeMock: MockProxy<Scope> = mock<Scope>();
  let spanMock: MockProxy<Span> = mock<Span>();

  beforeEach(() => {
    scopeMock = mock<Scope>();
    spanMock = mock<Span>();
    vi.resetAllMocks();

    vi.spyOn(tracer, "scope").mockReturnValue(scopeMock);
  });

  it("should throw an error when no active span", () => {
    scopeMock.active.mockReturnValue(null);

    expect(() => setTag({ name: "some-tag", value: "some-value" })).toThrow(new Error("No active span found"));
  });

  it("should call set tag for each tag pair returned by conversion method prepending with context", () => {
    scopeMock.active.mockReturnValue(spanMock);

    vi.mocked(toTags).mockReturnValue({ "some-tag.key1": "value1", "some-tag.key2": "value2" });

    setTag({ name: "some-tag", value: { key1: "value1", key2: "value2" } });

    expect(toTags).toHaveBeenCalledWith({ "some-tag": { key1: "value1", key2: "value2" } });
    expect(spanMock.setTag).toBeCalledWith("context.some-tag.key1", "value1");
    expect(spanMock.setTag).toBeCalledWith("context.some-tag.key2", "value2");
  });
});
