import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("useTheme throws when used outside a ThemeProvider", () => {
    function Standalone() {
      useTheme();
      return null;
    }
    expect(() => render(<Standalone />)).toThrow(
      "useTheme must be used within a ThemeProvider",
    );
  });

  it("hides children until mounted, then defaults to the system preference (light)", async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("uses the system dark preference when there is no saved theme", async () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("prefers a saved localStorage theme over the system preference", async () => {
    localStorage.setItem("theme", "dark");
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("dark"));
  });

  it("toggleTheme flips the theme, persists it and updates the document class", async () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("theme").textContent).toBe("light"));

    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
