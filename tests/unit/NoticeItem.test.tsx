import { afterEach, describe, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NoticeItem } from "@/components/notices/NoticeItem";

const Icon = ({ className }: { className?: string }) => <svg data-testid="icon" className={className} />;

const renderItem = (props: Partial<React.ComponentProps<typeof NoticeItem>> = {}) =>
  render(
    <NoticeItem
      title="Annual General Meeting"
      message="Please confirm your attendance with HR."
      time="2 hours ago"
      icon={Icon}
      iconColor="var(--primary)"
      iconBg="bg-blue-500/10 text-blue-500"
      {...props}
    />,
  );

// jsdom does no layout, so scrollHeight/clientHeight are always 0. Fake the
// browser's line-clamp behaviour: a clamped element reports more content than
// it can show; once the clamp class is removed it fits.
function fakeClampedLayout() {
  const proto = HTMLElement.prototype;
  const scrollHeight = Object.getOwnPropertyDescriptor(proto, "scrollHeight");
  const clientHeight = Object.getOwnPropertyDescriptor(proto, "clientHeight");
  const isClamped = (el: HTMLElement) => el.className.includes("line-clamp");
  Object.defineProperty(proto, "scrollHeight", { configurable: true, get: function (this: HTMLElement) { return isClamped(this) ? 120 : 40; } });
  Object.defineProperty(proto, "clientHeight", { configurable: true, get: function (this: HTMLElement) { return 40; } });
  return () => {
    if (scrollHeight) Object.defineProperty(proto, "scrollHeight", scrollHeight);
    else delete (proto as unknown as Record<string, unknown>).scrollHeight;
    if (clientHeight) Object.defineProperty(proto, "clientHeight", clientHeight);
    else delete (proto as unknown as Record<string, unknown>).clientHeight;
  };
}

describe("NoticeItem", () => {
  afterEach(cleanup);

  it("renders the title, message and time", () => {
    renderItem();
    expect(screen.getByText("Annual General Meeting")).toBeTruthy();
    expect(screen.getByText("Please confirm your attendance with HR.")).toBeTruthy();
    expect(screen.getByText("2 hours ago")).toBeTruthy();
  });

  it("wraps long unbroken text and keeps the message's line breaks", () => {
    const longTitle = "Maintenance_window_for_payroll_system_2026-10-15_to_2026-10-17_Please_complete_all_pending";
    renderItem({ title: longTitle, message: "Line one\n\nLine two" });
    expect(screen.getByText(longTitle).className).toContain("break-words");
    const message = screen.getByText(/Line one/);
    expect(message.className).toContain("break-words");
    expect(message.className).toContain("whitespace-pre-line");
  });

  it("does not offer 'Read more' when nothing is cut off", () => {
    renderItem();
    expect(screen.queryByRole("button", { name: "Read more" })).toBeNull();
  });

  describe("when the text is clamped", () => {
    it("offers 'Read more', expands in place and collapses again", () => {
      const restore = fakeClampedLayout();
      try {
        renderItem({ message: "A very long message ".repeat(40) });
        const title = screen.getByText("Annual General Meeting");
        const message = screen.getByText(/A very long message/);
        expect(title.className).toContain("line-clamp-2");
        expect(message.className).toContain("line-clamp-3");

        fireEvent.click(screen.getByRole("button", { name: "Read more" }));
        const showLess = screen.getByRole("button", { name: "Show less" });
        expect(showLess.getAttribute("aria-expanded")).toBe("true");
        expect(title.className).not.toContain("line-clamp");
        expect(message.className).not.toContain("line-clamp");

        fireEvent.click(showLess);
        const readMore = screen.getByRole("button", { name: "Read more" });
        expect(readMore.getAttribute("aria-expanded")).toBe("false");
        expect(message.className).toContain("line-clamp-3");
      } finally {
        restore();
      }
    });
  });
});
