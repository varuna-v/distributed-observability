import tracer from "dd-trace";
import { vi } from "vitest";

import { startSpan } from "./start-span";

describe("startSpan", () => {
  it("should call the function with the provided name", () => {
    const name = "test-span";
    const fn = vi.fn();
    const traceSpy = vi.spyOn(tracer, "trace");

    startSpan(name, fn);

    expect(traceSpy).toHaveBeenCalledWith(name, fn);
    expect(fn).toHaveBeenCalled();
  });
});
