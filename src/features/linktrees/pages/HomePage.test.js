import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as routerModule from "../../../router";
import store from "../states/linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Saya", email: "saya@del.org" };
const linkTrees = [
  { id: 1, user_id: 1, title: "Portofolio", description: "Karya saya", type: "public", cover: "http://x/c.png", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-02T00:00:00Z" },
  { id: 2, user_id: 2, title: "Musik Favorit", description: "", type: "unlisted", cover: null, created_at: "2024-01-03T00:00:00Z", updated_at: "2024-01-04T00:00:00Z" },
  { id: 3, user_id: 1, title: "Catatan Pribadi", description: "Rahasia", type: "private", created_at: "2024-01-05T00:00:00Z", updated_at: "2024-01-06T00:00:00Z" },
  { id: 4, user_id: 2, title: null, description: null, type: "public", created_at: "2024-01-05T00:00:00Z", updated_at: "2024-01-06T00:00:00Z" },
];

function setup(state = {}) {
  return renderWithProviders(HomePage, {
    preloadedState: { profile, linkTrees, ...state },
  });
}

describe("HomePage", () => {
  let loadSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    // Jangan pernah memanggil API sungguhan dari test halaman.
    loadSpy = vi.spyOn(store, "asyncSetLinkTrees").mockImplementation(async () => {});
  });

  it("should render nothing without a profile", () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile: null } });
    expect(wrapper.text().trim()).toBe("");
  });

  describe("with data", () => {
    let utils;

    beforeEach(async () => {
      utils = setup();
      await tick();
    });

    it("should call asyncSetLinkTrees on mount", () => {
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("should render a row per link tree with type badges", () => {
      const { wrapper } = utils;
      expect(wrapper.text()).toContain("Daftar Link Tree");
      expect(wrapper.find('[data-testid="linktree-row-1"]').text()).toContain("Portofolio");
      expect(wrapper.find('[data-testid="linktree-row-2"]').text()).toContain("Musik Favorit");
      expect(wrapper.findAll('[data-testid="type-badge"]').map((b) => b.text().trim())).toEqual([
        "Publik",
        "Tidak Terdaftar",
        "Privat",
        "Publik",
      ]);
      // cover hanya ada pada baris yang memilikinya
      expect(wrapper.find('[data-testid="linktree-row-1"] img').exists()).toBe(true);
      expect(wrapper.find('[data-testid="linktree-row-2"] img').exists()).toBe(false);
    });

    it("should show statistics per type", () => {
      const { wrapper } = utils;
      expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("4");
      expect(wrapper.find('[data-testid="stat-public"]').text()).toBe("2");
      expect(wrapper.find('[data-testid="stat-unlisted"]').text()).toBe("1");
      expect(wrapper.find('[data-testid="stat-private"]').text()).toBe("1");
    });

    it("should search by title or description, case-insensitively", async () => {
      const { wrapper } = utils;
      const input = wrapper.find('[data-testid="search-linktree-input"]');

      await input.setValue("MUSIK");
      expect(wrapper.find('[data-testid="linktree-row-2"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="linktree-row-1"]').exists()).toBe(false);

      await input.setValue("rahasia");
      expect(wrapper.find('[data-testid="linktree-row-3"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="linktree-row-2"]').exists()).toBe(false);

      await input.setValue("   ");
      expect(wrapper.findAll("tbody tr").length).toBe(4);
    });

    it("should show an empty state when nothing matches", async () => {
      const { wrapper } = utils;
      await wrapper.find('[data-testid="search-linktree-input"]').setValue("tidak-ada-yang-cocok");
      expect(wrapper.text()).toContain("Belum ada data link tree yang cocok.");
    });

    it("should filter to my link trees and back to all", async () => {
      const { wrapper } = utils;

      await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
      expect(wrapper.findAll("tbody tr").map((r) => r.element.dataset.testid)).toEqual([
        "linktree-row-1",
        "linktree-row-3",
      ]);

      await wrapper.find('[data-testid="filter-all-btn"]').trigger("click");
      expect(wrapper.findAll("tbody tr").length).toBe(4);
    });

    it("should navigate to the detail page", async () => {
      const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
      await utils.wrapper.find('[data-testid="view-linktree-2"]').trigger("click");
      expect(navSpy).toHaveBeenCalledWith("/link-trees/2");
    });

    it("should open the add modal", async () => {
      const { wrapper } = utils;
      await wrapper.find('[data-testid="add-linktree-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="add-linktree-modal"]').exists()).toBe(true);

      await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="add-linktree-modal"]').exists()).toBe(false);
    });

    it("should open the change modal for the selected row and close it", async () => {
      const { wrapper } = utils;
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 3, title: "Catatan", type: "private", description: "d" });

      await wrapper.find('[data-testid="edit-linktree-3"]').trigger("click");
      await tick();

      expect(wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(true);
      expect(linkTreeApi.getLinkTreeById).toHaveBeenCalledWith(3);

      await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
      expect(wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(false);
    });

    it("should delete one link tree only after confirmation", async () => {
      const { wrapper, linkTreesStore } = utils;
      const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
      await wrapper.find('[data-testid="delete-linktree-1"]').trigger("click");
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
      await wrapper.find('[data-testid="delete-linktree-1"]').trigger("click");
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });

    it("should delete all link trees only after confirmation", async () => {
      const { wrapper, linkTreesStore } = utils;
      const deleteAllSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDeleteAll").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
      await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
      await tick();
      expect(deleteAllSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
      await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
      await tick();
      expect(deleteAllSpy).toHaveBeenCalledTimes(1);
    });

    it("should reload the list after a single delete", async () => {
      loadSpy.mockClear();
      utils.linkTreesStore.setIsLinkTreeDeleted(true);
      await tick();

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(utils.linkTreesStore.$state.isLinkTreeDeleted).toBe(false);
    });

    it("should reload the list after deleting all", async () => {
      loadSpy.mockClear();
      utils.linkTreesStore.setIsLinkTreeDeletedAll(true);
      await tick();

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(utils.linkTreesStore.$state.isLinkTreeDeletedAll).toBe(false);
    });
  });

  it("should hide the delete-all button when there is no data", async () => {
    const { wrapper } = setup({ linkTrees: [] });
    await tick();

    expect(wrapper.find('[data-testid="delete-all-btn"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Belum ada data link tree yang cocok.");
  });

  it("should show a loading state while the list is loading and empty", async () => {
    let finish;
    loadSpy.mockReturnValue(new Promise((r) => (finish = r)));
    const { wrapper } = setup({ linkTrees: [] });
    await tick();

    expect(wrapper.text()).toContain("Memuat daftar link tree...");

    finish();
    await tick();
    expect(wrapper.text()).not.toContain("Memuat daftar link tree...");
  });

  it("should treat a null link tree list as empty", async () => {
    const { wrapper, linkTreesStore } = setup();
    await tick();

    linkTreesStore.setLinkTrees(null);
    await tick();

    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("0");
  });

  it("should not match 'mine' filter when profile id differs", async () => {
    const { wrapper } = setup({ profile: { id: 99, name: "Lain" } });
    await tick();

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    expect(wrapper.text()).toContain("Belum ada data link tree yang cocok.");
  });
});
