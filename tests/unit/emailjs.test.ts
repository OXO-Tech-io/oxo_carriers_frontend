import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("@emailjs/browser", () => ({
  default: { send: sendMock },
}));

import { sendBrowserEmail } from "@/lib/emailjs";

describe("sendBrowserEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_EMAILJS_SERVICE_ID", "service1");
    vi.stubEnv("NEXT_PUBLIC_EMAILJS_TEMPLATE_ID", "template1");
    vi.stubEnv("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY", "key1");
  });

  it("sends an email using env configuration", async () => {
    sendMock.mockResolvedValueOnce({ status: 200, text: "OK" });
    const result = await sendBrowserEmail({ to_name: "John" });

    expect(sendMock).toHaveBeenCalledWith(
      "service1",
      "template1",
      { to_name: "John" },
      "key1",
    );
    expect(result).toEqual({ status: 200, text: "OK" });
  });

  it("uses an explicit templateId override when provided", async () => {
    sendMock.mockResolvedValueOnce({ status: 200, text: "OK" });
    await sendBrowserEmail({ to_name: "John" }, "custom-template");

    expect(sendMock).toHaveBeenCalledWith(
      "service1",
      "custom-template",
      { to_name: "John" },
      "key1",
    );
  });

  it("throws when configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_EMAILJS_SERVICE_ID", "");
    await expect(sendBrowserEmail({})).rejects.toThrow(
      "EmailJS configuration missing",
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("propagates errors from emailjs.send", async () => {
    sendMock.mockRejectedValueOnce(new Error("network down"));
    await expect(sendBrowserEmail({ to_name: "John" })).rejects.toThrow(
      "network down",
    );
  });
});
