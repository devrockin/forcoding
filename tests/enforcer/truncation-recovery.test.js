import { describe, it, expect, beforeEach, vi } from "vitest";
import { TruncationRecovery } from "../../src/enforcer/truncation-recovery.js";

describe("TruncationRecovery", function() {
  let recovery;

  beforeEach(function() {
    recovery = new TruncationRecovery();
  });

  it("MAX_RETRIES is 2", function() {
    expect(TruncationRecovery.MAX_RETRIES).toBe(2);
  });

  it("detect complete HTML returns truncated false", async function() {
    var result = await recovery.detect("<html><head></head><body><main><section><article>longer content for testing to avoid too short warning triggered by the 200 char limit we need to exceed in output length</article></section></main></body></html>" + "x".repeat(100), { tags: { domain: "frontend" } });
    expect(result.truncated).toBe(false);
  });

  it("detect unclosed HTML returns truncated true", async function() {
    var result = await recovery.detect("<html>", { tags: { domain: "frontend" } });
    expect(result.truncated).toBe(true);
    expect(result.signals.some(function(s) { return s.type === "unclosed-html"; })).toBe(true);
  });

  it("detect unbalanced braces returns truncated true", async function() {
    var result = await recovery.detect("{{{{", { tags: { form: "single-page" } });
    expect(result.truncated).toBe(true);
    expect(result.signals.some(function(s) { return s.type === "unbalanced-braces"; })).toBe(true);
  });

  it("detect tiny output returns warning signal", async function() {
    var result = await recovery.detect("tiny", { tags: {} });
    expect(result.truncated).toBe(true);
    expect(result.signals.some(function(s) { return s.type === "too-short" && s.severity === "warning"; })).toBe(true);
  });

  it("detect returns signals array", async function() {
    var result = await recovery.detect("<html>{{{{", { tags: { domain: "frontend" } });
    expect(Array.isArray(result.signals)).toBe(true);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it("handle when retryCount less than MAX_RETRIES returns retry", async function() {
    var mockStore = { load: vi.fn(function() { return { buildRetries: 0 }; }) };
    recovery.store = mockStore;
    var truncResult = { truncated: true, signals: [{ type: "unclosed-html" }] };
    var result = await recovery.handle(truncResult, "<html>", { sessionId: "s1" });
    expect(result.action).toBe("retry");
    expect(result.retryCount).toBe(1);
  });

  it("handle increments retryCount based on store", async function() {
    var mockStore = { load: vi.fn(function() { return { buildRetries: 1 }; }) };
    recovery.store = mockStore;
    var truncResult = { truncated: true, signals: [{ type: "unclosed-html" }] };
    var result = await recovery.handle(truncResult, "<html><body>", { sessionId: "s1" });
    expect(result.retryCount).toBe(2);
    expect(result.action).toBe("retry");
  });

  it("handle when retryCount exceeds MAX_RETRIES returns halt", async function() {
    var mockStore = { load: vi.fn(function() { return { buildRetries: 2 }; }) };
    recovery.store = mockStore;
    var truncResult = { truncated: true, signals: [{ type: "unclosed-html" }] };
    var result = await recovery.handle(truncResult, "<html>", { sessionId: "s1" });
    expect(result.action).toBe("halt");
    expect(result.retryCount).toBe(3);
    expect(result.reason).toContain("Manual intervention");
  });

  it("estimateMinLines game domain returns 100", function() {
    expect(recovery.estimateMinLines({ domain: "game" })).toBe(100);
  });

  it("estimateMinLines single-page form returns 50", function() {
    expect(recovery.estimateMinLines({ form: "single-page" })).toBe(50);
  });

  it("estimateMinLines api form returns 30", function() {
    expect(recovery.estimateMinLines({ form: "api" })).toBe(30);
  });

  it("estimateMinLines empty tags returns 20", function() {
    expect(recovery.estimateMinLines({})).toBe(20);
  });
});