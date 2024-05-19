import { sendDistributionMetric } from "datadog-lambda-js";

import { toTags } from "../tags/to-tags";

type Metric = { name: "num_audiences"; value: number; tags: { tenant_id: string } };

export function sendMetric<TName extends Metric["name"]>(metric: Extract<Metric, { name: TName }>): void {
  const { name, value, tags = undefined } = metric;
  const formattedTags = tags ? Object.entries(toTags(tags)).map(([key, value]) => `${key}:${value}`) : [];

  sendDistributionMetric(name, value, ...formattedTags);
}
