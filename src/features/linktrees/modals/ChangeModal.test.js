import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const existing = { id: 1, title: "Lama", type: "unlisted", description: "Deskripsi lama", items: [] };

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render or fetch when show is false", () => {
    const fetchSpy = vi.spyOn(linkTreeApi, "getLinkTreeById");
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: false, linkTreeId: 1 } });

    expect(wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should not fetch when linkTreeId is missing", () => {
    const fetchSpy = vi.spyOn(linkTreeApi, "getLinkTreeById");
    renderWithProviders(ChangeModal, { props: { show: true } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should show a spinner while fetching, then fill the form", async () => {
    let resolve;
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockReturnValue(new Promise((r) => (resolve = r)));
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1 } });
    await tick();

    expect(wrapper.find('[data-testid="edit-linktree-title-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="submit-edit-modal-btn"]').element.disabled).toBe(true);

    resolve(existing);
    await tick();

    expect(wrapper.find('[data-testid="edit-linktree-title-input"]').element.value).toBe("Lama");
    expect(wrapper.find('[data-testid="edit-linktree-type-select"]').element.value).toBe("unlisted");
    expect(wrapper.find('[data-testid="edit-linktree-description-input"]').element.value).toBe(
      "Deskripsi lama"
    );
  });

  it("should use defaults when fetched data has missing fields", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 1 });
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1 } });
    await tick();

    expect(wrapper.find('[data-testid="edit-linktree-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="edit-linktree-type-select"]').element.value).toBe("public");
    expect(wrapper.find('[data-testid="edit-linktree-description-input"]').element.value).toBe("");
  });

  it("should leave the form untouched when API returns nothing", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(undefined);
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1 } });
    await tick();

    expect(wrapper.find('[data-testid="edit-linktree-title-input"]').element.value).toBe("");
  });

  it("should show an error and close when fetching fails", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockRejectedValue(new Error("x"));
    const closeSpy = vi.fn();

    renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1, onClose: closeSpy } });
    await tick();

    expect(errorSpy).toHaveBeenCalledWith("Gagal mengambil data link tree");
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should validate title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 1, title: "", description: "" });
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1 } });
    await tick();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="edit-linktree-title-input"]').setValue("Baru");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit changes, then reload list and detail and close when changed", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockResolvedValue();
    const listSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="edit-linktree-title-input"]').setValue(" Baru ");
    await wrapper.find('[data-testid="edit-linktree-type-select"]').setValue("private");
    await wrapper.find('[data-testid="edit-linktree-description-input"]').setValue(" Desc Baru ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(1, "Baru", "private", "Desc Baru");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeChange(true);
    linkTreesStore.setIsLinkTreeChanged(true);
    await tick();

    expect(listSpy).toHaveBeenCalled();
    expect(detailSpy).toHaveBeenCalledWith(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when the change fails", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockResolvedValue();
    await tick();

    await wrapper.find("form").trigger("submit");
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should close from both buttons, with or without onClose", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const a = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1, onClose: closeSpy } });
    await tick();
    await a.wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    await a.wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    a.wrapper.unmount();

    const b = renderWithProviders(ChangeModal, { props: { show: true, linkTreeId: 1 } });
    await tick();
    await b.wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(b.wrapper.find('[data-testid="edit-linktree-modal"]').exists()).toBe(true);
  });
});
