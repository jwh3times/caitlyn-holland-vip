import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  candidateDirs,
  currentRepoName,
  findKey,
  formatTimestamp,
  listDirectories,
  main,
  parseArgs,
  repoNameFromRemote,
  resolveHandoffsDir,
  updateMap,
} from "../../../scripts/handoff-map.mjs";

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "handoff-map-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

const sampleMap = () => ({
  FileName: "handoff_map.json",
  Last_Updated: "09-15-2026 13:54:25",
  Active_Handoffs: {
    "caitlyn-holland-vip": null,
    "vcs-lab": "vcs-lab-handoff-2026-09-15.md",
  },
});

describe("parseArgs", () => {
  it("accepts the three commands and their options", () => {
    expect(parseArgs(["get"]).command).toBe("get");
    expect(parseArgs(["set", "a.md", "--repo", "x"]).file).toBe("a.md");
    expect(parseArgs(["clear", "--dir", "D"]).dir).toBe("D");
  });

  it("rejects missing commands, missing values, paths, and extra arguments", () => {
    expect(() => parseArgs([])).toThrow(/Expected a command/u);
    expect(() => parseArgs(["set"])).toThrow(/needs the handoff file name/u);
    expect(() => parseArgs(["get", "--dir"])).toThrow(/--dir needs a value/u);
    expect(() => parseArgs(["set", "sub/a.md"])).toThrow(/not a path/u);
    expect(() => parseArgs(["get", "extra"])).toThrow(/Unknown argument/u);
  });
});

describe("findKey", () => {
  it("matches the owner's project names case- and punctuation-insensitively", () => {
    const active = { ApexRacers: null, "caitlyn-holland-vip": null, "vcs-lab": "v.md" };
    expect(findKey(active, "apexracers")).toBe("ApexRacers");
    expect(findKey(active, "Caitlyn_Holland_VIP")).toBe("caitlyn-holland-vip");
    expect(findKey(active, "leasebook")).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("uses the map's MM-dd-yyyy HH:mm:ss local format", () => {
    expect(formatTimestamp(new Date(2026, 8, 5, 7, 3, 9))).toBe("09-05-2026 07:03:09");
  });
});

describe("updateMap", () => {
  const now = new Date(2026, 8, 15, 14, 0, 0);

  it("sets and clears the matching key without touching others", () => {
    const set = updateMap(sampleMap(), "Caitlyn-Holland-VIP", "c.md", now);
    expect(set.key).toBe("caitlyn-holland-vip");
    expect(set.map.Active_Handoffs).toEqual({
      "caitlyn-holland-vip": "c.md",
      "vcs-lab": "vcs-lab-handoff-2026-09-15.md",
    });
    expect(set.map.Last_Updated).toBe("09-15-2026 14:00:00");

    const cleared = updateMap(set.map, "caitlyn-holland-vip", null, now);
    expect(cleared.map.Active_Handoffs["caitlyn-holland-vip"]).toBeNull();
  });

  it("adds a key only when setting, never when clearing", () => {
    expect(updateMap(sampleMap(), "leasebook", "l.md", now).map.Active_Handoffs.leasebook).toBe(
      "l.md"
    );
    const cleared = updateMap(sampleMap(), "leasebook", null, now);
    expect(cleared.key).toBeNull();
    expect(cleared.map).toEqual(sampleMap());
  });

  it("creates Active_Handoffs when the map has none", () => {
    const { map } = updateMap({ FileName: "handoff_map.json" }, "x", "x.md", now);
    expect(map.Active_Handoffs).toEqual({ x: "x.md" });
  });
});

describe("repoNameFromRemote", () => {
  it("handles HTTPS and SSH remotes", () => {
    expect(repoNameFromRemote("https://github.com/jwh3times/caitlyn-holland-vip.git\n")).toBe(
      "caitlyn-holland-vip"
    );
    expect(repoNameFromRemote("git@github.com:jwh3times/vcs-lab.git")).toBe("vcs-lab");
    expect(repoNameFromRemote("https://github.com/jwh3times/leasebook/")).toBe("leasebook");
    expect(repoNameFromRemote("")).toBeNull();
  });
});

describe("currentRepoName", () => {
  type Run = (command: string, args: string[]) => { status: number; stdout: string };
  const runner =
    (replies: Record<string, { status: number; stdout: string }>): Run =>
    (_command, args) =>
      replies[args.join(" ")] ?? { status: 1, stdout: "" };

  it("prefers the origin remote, then the checkout folder name", () => {
    const origin = { status: 0, stdout: "https://github.com/o/site.git\n" };
    expect(currentRepoName(runner({ "remote get-url origin": origin }))).toBe("site");
    const top = { status: 0, stdout: "/home/me/dev/folder\n" };
    expect(currentRepoName(runner({ "rev-parse --show-toplevel": top }))).toBe("folder");
  });

  it("explains how to proceed outside a repository", () => {
    expect(() => currentRepoName(runner({}))).toThrow(/pass --repo/u);
  });
});

describe("resolveHandoffsDir", () => {
  const listDir = () => ["acct"];

  it("finds the desktop client's account-nested folder", () => {
    const home = join("H");
    const nested = join(home, "Proton Drive", "acct", "My files", "Documents", "Handoffs");
    expect(candidateDirs(home, listDir)[0]).toBe(nested);
    const exists = (path: string) => path === join(nested, "handoff_map.json");
    expect(resolveHandoffsDir({ env: {}, home, exists, listDir })).toBe(nested);
  });

  it("prefers --dir, then HANDOFFS_DIR, and explains a miss", () => {
    const exists = () => true;
    const env = { HANDOFFS_DIR: "B" };
    expect(resolveHandoffsDir({ dir: "A", env, home: "H", exists, listDir })).toMatch(/A$/u);
    expect(resolveHandoffsDir({ env, home: "H", exists, listDir })).toMatch(/B$/u);
    expect(() => resolveHandoffsDir({ env: {}, home: "H", exists: () => false, listDir })).toThrow(
      /set HANDOFFS_DIR/u
    );
  });
});

describe("listDirectories", () => {
  it("lists child folders and treats a missing folder as empty", () => {
    mkdirSync(join(fixtureRoot, "acct"));
    writeFileSync(join(fixtureRoot, "file.txt"), "");
    expect(listDirectories(fixtureRoot)).toEqual(["acct"]);
    expect(listDirectories(join(fixtureRoot, "missing"))).toEqual([]);
  });
});

describe("main", () => {
  it("round-trips set, get, and clear against a real map file", () => {
    writeFileSync(join(fixtureRoot, "handoff_map.json"), JSON.stringify(sampleMap(), null, 2));
    writeFileSync(join(fixtureRoot, "c.md"), "# handoff\n");
    const common = ["--dir", fixtureRoot, "--repo", "caitlyn-holland-vip"];

    expect(() => main(["set", "missing.md", ...common])).toThrow(/Refusing/u);
    expect(main(["set", "c.md", ...common]).file).toBe("c.md");

    const got = main(["get", ...common]);
    expect(got).toMatchObject({ key: "caitlyn-holland-vip", file: "c.md", exists: true });
    expect(got.path).toBe(join(fixtureRoot, "c.md"));

    expect(main(["clear", ...common]).file).toBeNull();
    expect(main(["get", ...common])).toMatchObject({ file: null, path: null, exists: null });
    const onDisk = JSON.parse(readFileSync(join(fixtureRoot, "handoff_map.json"), "utf8"));
    expect(onDisk.Active_Handoffs["vcs-lab"]).toBe("vcs-lab-handoff-2026-09-15.md");
  });

  it("reads HANDOFFS_DIR and leaves the map alone when clearing an unknown repository", () => {
    const mapPath = join(fixtureRoot, "handoff_map.json");
    const original = JSON.stringify(sampleMap(), null, 2);
    writeFileSync(mapPath, original);
    const env = { HANDOFFS_DIR: fixtureRoot };

    expect(main(["get", "--repo", "leasebook"], env)).toMatchObject({ key: null, file: null });
    expect(main(["clear", "--repo", "leasebook"], env)).toMatchObject({ key: null, file: null });
    expect(readFileSync(mapPath, "utf8")).toBe(original);
  });
});
