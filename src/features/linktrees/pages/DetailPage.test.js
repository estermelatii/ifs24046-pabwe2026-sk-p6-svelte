import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as routerModule from "../../../router";
import { linkTreesStore as store } from "../states/linkTreesStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Saya" };
const items = [
  { id: 11, title: "GitHub", url: "https://github.com/me" },
  { id: 12, title: "Blog", url: "https://blog.me" },
];
const linkTree = {
  id: 5,
  user_id: 1,
  title: "Portofolio",
  description: "Baris satu\nBaris dua",
  type: "public",
  cover: "http://x/cover.png",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  items,
};

function setup(state = {}, props = { linkTreeId: "5" }) {
  return renderWithProviders(DetailPage, {
    props,
    preloadedState: { profile, linkTree, ...state },
  });
}

describe("DetailPage", () => {
  let loadSpy;
  let navSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    loadSpy = vi.spyOn(store, "asyncSetLinkTree").mockImplementation(async () => {});
    navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should show a spinner without profile or link tree", () => {
    const { wrapper } = setup({ profile: null });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.find("h1").exists()).toBe(false);

    const second = setup({ linkTree: null });
    expect(second.wrapper.find("h1").exists()).toBe(false);
  });

  it("should load the link tree on mount using the id", () => {
    setup();
    expect(loadSpy).toHaveBeenCalledWith("5");
  });

  it("should not load when no id is given", () => {
    setup({}, { linkTreeId: undefined });
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("should reload when the id prop changes", async () => {
    const { component, rerender } = setup();
    loadSpy.mockClear();
    await rerender({ linkTreeId: "6" });
    await tick();
    expect(loadSpy).toHaveBeenCalledWith("6");
    expect(component).toBeTruthy();
  });

  it("should render detail, cover, badge, description, and items", () => {
    const { wrapper } = setup();

    expect(wrapper.find("h1").text()).toContain("Portofolio");
    expect(wrapper.text()).toContain("#5");
    expect(wrapper.find('[data-testid="type-badge"]').text().trim()).toBe("Publik");
    expect(wrapper.find('img[alt="Portofolio"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="linktree-detail-description"]').text()).toContain("Baris satu");
    expect(wrapper.text()).toContain("Daftar Tautan (2)");

    const link = wrapper.find('[data-testid="item-row-11"] a');
    expect(link.attributes("href")).toBe("https://github.com/me");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
  });

  it("should render without cover, description, and items", () => {
    const { wrapper } = setup({
      linkTree: { id: 5, title: "Kosong", type: "private", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
    });

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("Tidak ada deskripsi");
    expect(wrapper.find('[data-testid="items-empty"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Daftar Tautan (0)");
  });

  it("should go back to the list", async () => {
    const { wrapper } = setup();
    await wrapper.find('[data-testid="back-to-linktrees-link"]').trigger("click");
    expect(navSpy).toHaveBeenCalledWith("/");
  });

  it("should redirect home when loading finishes without a link tree", async () => {
    const { linkTreesStore } = setup({ linkTree: null });
    navSpy.mockClear();

    linkTreesStore.setIsLinkTree(true);
    await tick();

    expect(navSpy).toHaveBeenCalledWith("/");
    expect(linkTreesStore.$state.isLinkTree).toBe(false);
  });

  it("should stay when loading finishes with a link tree", async () => {
    const { linkTreesStore } = setup();
    navSpy.mockClear();

    linkTreesStore.setIsLinkTree(true);
    await tick();

    expect(navSpy).not.toHaveBeenCalled();
  });

  it("should open and close the cover modal", async () => {
    const { wrapper } = setup();
    await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
  });

  it("should open and close the edit modal", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(linkTree);
    const { wrapper } = setup();

    await wrapper.find('[data-testid="edit-detail-linktree-btn"]').trigger("click");
    await tick();
    expect(wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(false);
  });

  it("should delete the link tree after confirmation and redirect when deleted", async () => {
    const { wrapper, linkTreesStore } = setup();
    const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-detail-linktree-btn"]').trigger("click");
    await tick();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-detail-linktree-btn"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith(5);

    navSpy.mockClear();
    linkTreesStore.setIsLinkTreeDeleted(true);
    await tick();
    expect(navSpy).toHaveBeenCalledWith("/");
    expect(linkTreesStore.$state.isLinkTreeDeleted).toBe(false);
  });

  it("should not delete when confirmed but the link tree has disappeared", async () => {
    const { wrapper, linkTreesStore } = setup();
    const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockResolvedValue();
    vi.spyOn(toolsHelper, "showConfirmDialog").mockImplementation(async () => {
      linkTreesStore.setLinkTree(null);
      return { isConfirmed: true };
    });

    await wrapper.find('[data-testid="delete-detail-linktree-btn"]').trigger("click");
    await tick();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should open the item modal in add mode", async () => {
    const { wrapper } = setup();
    await wrapper.find('[data-testid="add-item-btn"]').trigger("click");

    expect(wrapper.find('[data-testid="item-modal-title"]').text().trim()).toBe("Tambah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
  });

  it("should open the item modal in edit mode and close it", async () => {
    const { wrapper } = setup();
    await wrapper.find('[data-testid="edit-item-12"]').trigger("click");

    expect(wrapper.find('[data-testid="item-modal-title"]').text().trim()).toBe("Ubah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Blog");

    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);
  });

  it("should reset to add mode after editing an item first", async () => {
    const { wrapper } = setup();
    await wrapper.find('[data-testid="edit-item-11"]').trigger("click");
    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");

    await wrapper.find('[data-testid="add-item-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="item-modal-title"]').text().trim()).toBe("Tambah Tautan");
  });

  it("should delete an item only after confirmation", async () => {
    const { wrapper, linkTreesStore } = setup();
    const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemDelete").mockResolvedValue();
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-item-11"]').trigger("click");
    await tick();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-item-11"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith("5", 11);
  });

  it("should reload the detail after an item is deleted", async () => {
    const { linkTreesStore } = setup();
    loadSpy.mockClear();

    linkTreesStore.setIsItemDeleted(true);
    await tick();

    expect(loadSpy).toHaveBeenCalledWith("5");
    expect(linkTreesStore.$state.isItemDeleted).toBe(false);
  });
});
