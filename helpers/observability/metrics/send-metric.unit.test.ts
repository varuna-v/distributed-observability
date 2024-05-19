import { sendDistributionMetric } from "datadog-lambda-js";
import { vi } from "vitest";

import { toTags } from "../tags/to-tags";
import { sendMetric } from "./send-metric";

vi.mock("datadog-lambda-js");
vi.mock("../tags/to-tags");

describe("sendMetric", () => {
  it("should call sendDistributionMetric after converting the tags into a string array", () => {
    vi.mocked(toTags).mockReturnValue({ "tag1.key1": "value2", "tag1.key2": "value3" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendMetric({ name: "my-metric", value: 200, tags: { tag1: { key1: "value2", key2: "value3" } } } as any);

    expect(sendDistributionMetric).toHaveBeenCalledWith("my-metric", 200, ...["tag1.key1:value2", "tag1.key2:value3"]);
  });
});
