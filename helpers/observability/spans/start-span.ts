import tracer from "dd-trace";

export const startSpan = <T>(name: string, fn: () => T) => tracer.trace(name, fn);
