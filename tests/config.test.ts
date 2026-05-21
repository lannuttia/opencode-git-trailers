import { describe, it, expect } from "vitest";
import { readGitTrailers } from "../src/config.js";

describe("readGitTrailers", () => {
  it("should return empty object when no trailers configured", async () => {
    const trailers = await readGitTrailers("/tmp");
    expect(trailers).toEqual({});
  });
});
