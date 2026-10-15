import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-linktree-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should lock body scroll when shown", () => {
    renderWithProviders(AddModal, { props: { show: true } });
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should list all three link tree types, defaulting to public", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    const select = wrapper.find('[data-testid="add-linktree-type-select"]');
    expect(select.findAll("option").map((o) => o.element.value)).toEqual([
      "public",
      "unlisted",
      "private",
    ]);
    expect(select.element.value).toBe("public");
  });

  it("should show validation error if title is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find("form").trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");
  });

  it("should show validation error if description is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find('[data-testid="add-linktree-title-input"]').setValue("Judul");
    await wrapper.find("form").trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit trimmed values with selected type, then reload and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockResolvedValue();
    const reloadSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockResolvedValue();

    await wrapper.find('[data-testid="add-linktree-title-input"]').setValue("  Portofolio  ");
    await wrapper.find('[data-testid="add-linktree-type-select"]').setValue("private");
    await wrapper.find('[data-testid="add-linktree-description-input"]').setValue("  Semua karya  ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith("Portofolio", "private", "Semua karya");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeAdd(true);
    linkTreesStore.setIsLinkTreeAdded(true);
    await tick();

    expect(reloadSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
    // formulir direset setelah sukses
    expect(wrapper.find('[data-testid="add-linktree-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="add-linktree-type-select"]').element.value).toBe("public");
  });

  it("should stay open and stop loading when add fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockResolvedValue();

    await wrapper.find('[data-testid="add-linktree-title-input"]').setValue("A");
    await wrapper.find('[data-testid="add-linktree-description-input"]').setValue("B");
    await wrapper.find("form").trigger("submit");
    await tick();

    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
    expect(wrapper.find('[data-testid="add-linktree-modal"]').exists()).toBe(true);
  });

  it("should close from both close and cancel buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const withCallback = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    await withCallback.wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await withCallback.wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    withCallback.wrapper.unmount();

    const withoutCallback = renderWithProviders(AddModal, { props: { show: true } });
    await withoutCallback.wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(withoutCallback.wrapper.find('[data-testid="add-linktree-modal"]').exists()).toBe(true);
  });
});
