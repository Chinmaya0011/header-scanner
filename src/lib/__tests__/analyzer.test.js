import {
  normalizeUrl,
  isValidTarget,
  maskDomain
} from "../analyzer";
import {
  isIPPrivate,
  isPrivateHost
} from "../server/ipUtils";

describe("analyzer utilities", () => {
  describe("normalizeUrl", () => {
    test("should handle domain names", () => {
      expect(normalizeUrl("example.com")).toBe("https://example.com");
      expect(normalizeUrl("http://example.com")).toBe("http://example.com");
      expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    });

    test("should preserve custom ports", () => {
      expect(normalizeUrl("example.com:3000")).toBe("https://example.com:3000");
      expect(normalizeUrl("http://example.com:8080")).toBe("http://example.com:8080");
    });

    test("should handle IPv4 addresses", () => {
      expect(normalizeUrl("1.2.3.4")).toBe("https://1.2.3.4");
      expect(normalizeUrl("1.2.3.4:5000")).toBe("https://1.2.3.4:5000");
    });

    test("should normalize bare IPv6 addresses and add brackets", () => {
      expect(normalizeUrl("2001:db8::1")).toBe("https://[2001:db8::1]");
      expect(normalizeUrl("2001:db8::1:3000")).toBe("https://[2001:db8::1]:3000");
    });

    test("should preserve bracketed IPv6 addresses", () => {
      expect(normalizeUrl("[2001:db8::1]")).toBe("https://[2001:db8::1]");
      expect(normalizeUrl("[2001:db8::1]:3000")).toBe("https://[2001:db8::1]:3000");
    });
  });

  describe("isValidTarget", () => {
    test("should validate standard domains", () => {
      expect(isValidTarget("example.com")).toBe(true);
      expect(isValidTarget("sub.domain.co.uk")).toBe(true);
      expect(isValidTarget("https://example.com")).toBe(true);
    });

    test("should validate domains with ports", () => {
      expect(isValidTarget("example.com:3000")).toBe(true);
      expect(isValidTarget("example.com:65535")).toBe(true);
    });

    test("should validate IPv4 addresses", () => {
      expect(isValidTarget("1.2.3.4")).toBe(true);
      expect(isValidTarget("1.2.3.4:3000")).toBe(true);
    });

    test("should validate IPv6 addresses", () => {
      expect(isValidTarget("2001:db8::1")).toBe(true);
      expect(isValidTarget("[2001:db8::1]")).toBe(true);
      expect(isValidTarget("[2001:db8::1]:8080")).toBe(true);
    });

    test("should reject invalid targets", () => {
      expect(isValidTarget("example")).toBe(false);
      expect(isValidTarget("http://")).toBe(false);
      expect(isValidTarget("example.com:70000")).toBe(false);
      expect(isValidTarget("example.com:-1")).toBe(false);
      expect(isValidTarget("example.org:port")).toBe(false);
    });
  });

  describe("isIPPrivate", () => {
    test("should identify private IPv4 addresses", () => {
      expect(isIPPrivate("127.0.0.1")).toBe(true);
      expect(isIPPrivate("10.0.0.1")).toBe(true);
      expect(isIPPrivate("172.16.0.1")).toBe(true);
      expect(isIPPrivate("172.31.255.255")).toBe(true);
      expect(isIPPrivate("192.168.1.1")).toBe(true);
      expect(isIPPrivate("169.254.0.1")).toBe(true);
      expect(isIPPrivate("0.0.0.0")).toBe(true);
    });

    test("should identify public IPv4 addresses", () => {
      expect(isIPPrivate("1.1.1.1")).toBe(false);
      expect(isIPPrivate("8.8.8.8")).toBe(false);
      expect(isIPPrivate("172.15.255.255")).toBe(false);
      expect(isIPPrivate("172.32.0.1")).toBe(false);
    });

    test("should identify private IPv6 addresses", () => {
      expect(isIPPrivate("::1")).toBe(true);
      expect(isIPPrivate("::")).toBe(true);
      expect(isIPPrivate("fe80::1")).toBe(true);
      expect(isIPPrivate("fc00::")).toBe(true);
    });

    test("should identify public IPv6 addresses", () => {
      expect(isIPPrivate("2001:db8::1")).toBe(false);
    });
  });

  describe("isPrivateHost", () => {
    test("should check hosts and IPs with or without ports", async () => {
      await expect(isPrivateHost("localhost")).resolves.toBe(true);
      await expect(isPrivateHost("127.0.0.1:3000")).resolves.toBe(true);
      await expect(isPrivateHost("[::1]:80")).resolves.toBe(true);
      await expect(isPrivateHost("1.1.1.1:80")).resolves.toBe(false);
      await expect(isPrivateHost("[2001:db8::1]:443")).resolves.toBe(false);
    });
  });

  describe("maskDomain", () => {
    test("should mask domains and subdomains", () => {
      expect(maskDomain("example.com")).toBe("ex*****.com");
      expect(maskDomain("sub.example.com")).toBe("sub.ex*****.com");
    });

    test("should mask IPv4 addresses", () => {
      expect(maskDomain("1.2.3.4")).toBe("1.***.***.4");
      expect(maskDomain("192.168.1.1")).toBe("192.***.***.1");
    });

    test("should mask IPv6 addresses", () => {
      expect(maskDomain("[2001:db8::1]")).toBe("[2001:***::1]");
    });

    test("should preserve ports during masking", () => {
      expect(maskDomain("example.com:3000")).toBe("ex*****.com:3000");
      expect(maskDomain("1.2.3.4:5000")).toBe("1.***.***.4:5000");
      expect(maskDomain("[2001:db8::1]:8080")).toBe("[2001:***::1]:8080");
    });
  });
});
