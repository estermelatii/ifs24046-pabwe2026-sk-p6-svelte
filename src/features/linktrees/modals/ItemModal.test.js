import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemModal from "./ItemModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const item = { id: 7, title: "GitHub", url: "https://github.com/me" };

async function fill(wrapper, title, url) {
  await wrapper.find('[data-testid="item-title-input"]').setValue(title);
  await wrapper.find('[data-testid="item-url-input"]').setValue(url);
}

describe("ItemModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: false, linkTreeId: 1 } });
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render add mode with an empty form", () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1 } });
    expect(wrapper.find('[data-testid="item-modal-title"]').text().trim()).toBe("Tambah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("");
    expect(wrapper.text()).toContain("Simpan Tautan");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should render edit mode prefilled with the item", () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1, item } });
    expect(wrapper.find('[data-testid="item-modal-title"]').text().trim()).toBe("Ubah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("GitHub");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("https://github.com/me");
    expect(wrapper.text()).toContain("Perbarui Tautan");
  });

  it("should use empty strings when the item lacks title and url", () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1, item: { id: 1 } } });
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("");
  });

  it("should validate title, url presence, and url format", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1 } });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Judul tautan tidak boleh kosong");

    await fill(wrapper, "GitHub", "   ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("URL tidak boleh kosong");

    await fill(wrapper, "GitHub", "bukan-url");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("URL harus diawali http:// atau https://");

    await fill(wrapper, "FTP", "ftp://example.com");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledTimes(4);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should accept both https and http urls", async () => {
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1 } });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();

    await fill(wrapper, "Aman", "https://aman.id");
    await wrapper.find("form").trigger("submit");
    await fill(wrapper, "Biasa", "http://biasa.id");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledTimes(2);
  });

  it("should add an item, then reload detail and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 3, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();

    await fill(wrapper, "  GitHub ", " https://github.com/me ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith(3, "GitHub", "https://github.com/me");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsItemAdd(true);
    linkTreesStore.setIsItemAdded(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(3);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when adding fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 3, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();

    await fill(wrapper, "GitHub", "https://github.com");
    await wrapper.find("form").trigger("submit");
    linkTreesStore.setIsItemAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should update an item, then reload detail and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 3, item, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemChange").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();

    await fill(wrapper, "GH Baru", "https://gh.io");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(3, 7, "GH Baru", "https://gh.io");

    linkTreesStore.setIsItemChange(true);
    linkTreesStore.setIsItemChanged(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(3);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when updating fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 3, item, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsItemChange").mockResolvedValue();

    await wrapper.find("form").trigger("submit");
    linkTreesStore.setIsItemChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should close from both buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const a = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1, onClose: closeSpy } });
    await a.wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    await a.wrapper.find('[data-testid="cancel-item-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    a.wrapper.unmount();

    const b = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 1 } });
    await b.wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(b.wrapper.find('[data-testid="item-modal"]').exists()).toBe(true);
  });
});
