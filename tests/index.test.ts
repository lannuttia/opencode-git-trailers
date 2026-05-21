import { describe, it, expect } from "vitest";
import plugin from "../src/index.js";

describe("opencode-git-trailers", () => {
  it("should export a plugin function", () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("function");
  });

  it("should return hooks object", async () => {
    const hooks = await plugin();
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe("object");
  });
});
