import { describe, expect, it } from "vitest";
import {
  diffContractSnapshot,
  extractFixtureIds,
  extractSnapshotIds,
} from "./contract-snapshots.ts";

const SPEC_FIXTURE = `defineContractTests({
  component: "button",
  rootClass: "t-button",
  fixtureIds: [
    "solid-primary",
    "loading",
    "cov-solid-primary-md",
  ],
});`;

describe("extractFixtureIds", () => {
  it("reads each quoted id from the fixtureIds array", () => {
    expect(extractFixtureIds(SPEC_FIXTURE)).toEqual([
      "solid-primary",
      "loading",
      "cov-solid-primary-md",
    ]);
  });

  it("returns [] when no fixtureIds array is present", () => {
    expect(extractFixtureIds("// some other file")).toEqual([]);
  });
});

describe("extractSnapshotIds", () => {
  it("reads each `<!-- id -->` section marker", () => {
    const snapshot = [
      "<!-- solid-primary -->",
      '<button class="t-button"></button>',
      "",
      "<!-- cov-solid-primary-md -->",
      "<button></button>",
    ].join("\n");
    expect(extractSnapshotIds(snapshot)).toEqual(["solid-primary", "cov-solid-primary-md"]);
  });

  it("ignores non-marker comments and inline HTML", () => {
    const snapshot = "<button><!-- inline comment --></button>\n<!-- solid-primary -->\n";
    expect(extractSnapshotIds(snapshot)).toEqual(["solid-primary"]);
  });
});

describe("diffContractSnapshot", () => {
  it("flags a fixture id that has no snapshot section", () => {
    const snapshot = "<!-- solid-primary -->\n<button></button>\n";
    const { missing, orphan } = diffContractSnapshot(SPEC_FIXTURE, snapshot);
    expect(missing.sort()).toEqual(["cov-solid-primary-md", "loading"]);
    expect(orphan).toEqual([]);
  });

  it("flags an orphan snapshot section that has no fixture id", () => {
    const snapshot = [
      "<!-- solid-primary -->",
      "<button></button>",
      "<!-- loading -->",
      "<button></button>",
      "<!-- cov-solid-primary-md -->",
      "<button></button>",
      "<!-- stale-fixture -->",
      "<button></button>",
    ].join("\n");
    const { missing, orphan } = diffContractSnapshot(SPEC_FIXTURE, snapshot);
    expect(missing).toEqual([]);
    expect(orphan).toEqual(["stale-fixture"]);
  });

  it("returns empty when ids and sections agree", () => {
    const snapshot = [
      "<!-- solid-primary -->",
      "<button></button>",
      "<!-- loading -->",
      "<button></button>",
      "<!-- cov-solid-primary-md -->",
      "<button></button>",
    ].join("\n");
    expect(diffContractSnapshot(SPEC_FIXTURE, snapshot)).toEqual({ missing: [], orphan: [] });
  });
});
