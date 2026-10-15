import { describe, it, expect } from "vitest";
import TypeBadge from "./TypeBadge.svelte";
import { renderWithProviders } from "../../../test-utils";

describe("TypeBadge", () => {
  it.each([
    ["public", "Publik", "emerald"],
    ["unlisted", "Tidak Terdaftar", "amber"],
    ["private", "Privat", "slate"],
  ])("should render %s as %s", (type, label, color) => {
    const { wrapper } = renderWithProviders(TypeBadge, { props: { type } });
    const badge = wrapper.find('[data-testid="type-badge"]');
    expect(badge.text().trim()).toBe(label);
    expect(badge.element.className).toContain(color);
  });

  it("should render unknown type text as-is", () => {
    const { wrapper } = renderWithProviders(TypeBadge, { props: { type: "custom" } });
    expect(wrapper.find('[data-testid="type-badge"]').text().trim()).toBe("custom");
  });
});
