import tracer from "dd-trace";

tracer.init();

export * from "./spans/start-span";
export * from "./spans/set-tag";
export * from "./metrics/send-metric";
