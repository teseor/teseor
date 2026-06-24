import { z } from "zod";

export const coverageDimension = z.union([z.boolean(), z.array(z.string())]);
export const coverageBlock = z.record(z.string(), coverageDimension);
