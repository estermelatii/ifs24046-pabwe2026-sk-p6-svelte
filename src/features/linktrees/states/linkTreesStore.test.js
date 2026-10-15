import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkTreesStore, linkTreesStore } from "./linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("linkTreesStore", () => {
  beforeEach(() => {
    linkTreesStore.reset();
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => {});
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should have correct default state", () => {
    const state = useLinkTreesStore().$state;
    expect(state.linkTrees).toEqual([]);
    expect(state.linkTree).toBeNull();
    const flags = Object.entries(state).filter(([k]) => k.startsWith("is"));
    expect(flags.length).toBe(17);
    expect(flags.every(([, v]) => v === false)).toBe(true);
  });

  it("should update state with every setter", () => {
    const store = useLinkTreesStore();
    store.setLinkTrees([{ id: 1 }]);
    store.setLinkTree({ id: 1 });
    expect(store.$state.linkTrees).toEqual([{ id: 1 }]);
    expect(store.$state.linkTree).toEqual({ id: 1 });

    const flagSetters = {
      setIsLinkTree: "isLinkTree",
      setIsLinkTreeAdd: "isLinkTreeAdd",
      setIsLinkTreeAdded: "isLinkTreeAdded",
      setIsLinkTreeChange: "isLinkTreeChange",
      setIsLinkTreeChanged: "isLinkTreeChanged",
      setIsLinkTreeChangeCover: "isLinkTreeChangeCover",
      setIsLinkTreeChangedCover: "isLinkTreeChangedCover",
      setIsLinkTreeDelete: "isLinkTreeDelete",
      setIsLinkTreeDeleted: "isLinkTreeDeleted",
      setIsLinkTreeDeleteAll: "isLinkTreeDeleteAll",
      setIsLinkTreeDeletedAll: "isLinkTreeDeletedAll",
      setIsItemAdd: "isItemAdd",
      setIsItemAdded: "isItemAdded",
      setIsItemChange: "isItemChange",
      setIsItemChanged: "isItemChanged",
      setIsItemDelete: "isItemDelete",
      setIsItemDeleted: "isItemDeleted",
    };
    for (const [setter, key] of Object.entries(flagSetters)) {
      store[setter](true);
      expect(store.$state[key]).toBe(true);
    }
  });

  it("should be subscribable and resettable with partial state", () => {
    const values = [];
    const unsub = linkTreesStore.subscribe((v) => values.push(v));
    linkTreesStore.reset({ linkTrees: [{ id: 9 }] });
    unsub();
    expect(values.at(-1).linkTrees).toEqual([{ id: 9 }]);
    expect(values.at(-1).linkTree).toBeNull();
  });

  describe("asyncSetLinkTrees", () => {
    it("should set link trees on success", async () => {
      vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([{ id: 1 }]);
      await linkTreesStore.asyncSetLinkTrees();
      expect(linkTreesStore.$state.linkTrees).toEqual([{ id: 1 }]);
    });

    it("should set empty array on error", async () => {
      linkTreesStore.setLinkTrees([{ id: 1 }]);
      vi.spyOn(linkTreeApi, "getLinkTrees").mockRejectedValue(new Error("x"));
      await linkTreesStore.asyncSetLinkTrees();
      expect(linkTreesStore.$state.linkTrees).toEqual([]);
    });
  });

  describe("asyncSetLinkTree", () => {
    it("should set detail and raise isLinkTree on success", async () => {
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 2 });
      await linkTreesStore.asyncSetLinkTree(2);
      expect(linkTreesStore.$state.linkTree).toEqual({ id: 2 });
      expect(linkTreesStore.$state.isLinkTree).toBe(true);
    });

    it("should set null and raise isLinkTree on error", async () => {
      linkTreesStore.setLinkTree({ id: 1 });
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockRejectedValue(new Error("x"));
      await linkTreesStore.asyncSetLinkTree(2);
      expect(linkTreesStore.$state.linkTree).toBeNull();
      expect(linkTreesStore.$state.isLinkTree).toBe(true);
    });
  });

  // Semua mutasi berbagi pola yang sama: [metode store, metode API, argumen, bendera selesai, bendera hasil, pesan fallback]
  const mutations = [
    ["asyncSetIsLinkTreeAdd", "postLinkTree", ["T", "public", "D"], "isLinkTreeAdd", "isLinkTreeAdded", "Link tree berhasil ditambahkan!"],
    ["asyncSetIsLinkTreeChange", "putLinkTree", [1, "T", "private", "D"], "isLinkTreeChange", "isLinkTreeChanged", "Link tree berhasil diperbarui!"],
    ["asyncSetIsLinkTreeChangeCover", "postLinkTreeCover", [1, new File(["x"], "a.png")], "isLinkTreeChangeCover", "isLinkTreeChangedCover", "Sampul berhasil diperbarui!"],
    ["asyncSetIsLinkTreeDelete", "deleteLinkTree", [1], "isLinkTreeDelete", "isLinkTreeDeleted", "Link tree berhasil dihapus!"],
    ["asyncSetIsLinkTreeDeleteAll", "deleteAllLinkTrees", [], "isLinkTreeDeleteAll", "isLinkTreeDeletedAll", "Semua link tree berhasil dihapus!"],
    ["asyncSetIsItemAdd", "postItem", [1, "GH", "https://gh.io"], "isItemAdd", "isItemAdded", "Tautan berhasil ditambahkan!"],
    ["asyncSetIsItemChange", "putItem", [1, 2, "GH", "https://gh.io"], "isItemChange", "isItemChanged", "Tautan berhasil diperbarui!"],
    ["asyncSetIsItemDelete", "deleteItem", [1, 2], "isItemDelete", "isItemDeleted", "Tautan berhasil dihapus!"],
  ];

  describe.each(mutations)("%s", (method, apiMethod, args, finishFlag, doneFlag, fallback) => {
    it("should call API, show the API message, and set flags on success", async () => {
      const spy = vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue("Pesan dari API");

      await linkTreesStore[method](...args);

      expect(spy).toHaveBeenCalledWith(...args);
      expect(linkTreesStore.$state[doneFlag]).toBe(true);
      expect(linkTreesStore.$state[finishFlag]).toBe(true);
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalled();
    });

    it("should show fallback message when API returns no message", async () => {
      vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue(undefined);

      await linkTreesStore[method](...args);

      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(fallback);
    });

    it("should show error and keep result flag false on failure", async () => {
      vi.spyOn(linkTreeApi, apiMethod).mockRejectedValue(new Error("Boom"));

      await linkTreesStore[method](...args);

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Boom");
      expect(linkTreesStore.$state[doneFlag]).toBe(false);
      expect(linkTreesStore.$state[finishFlag]).toBe(true);
    });
  });

  it("add should always use its own success message (API returns data, not message)", async () => {
    vi.spyOn(linkTreeApi, "postLinkTree").mockResolvedValue({ link_tree_id: 1 });
    await linkTreesStore.asyncSetIsLinkTreeAdd("T", "public", "D");
    expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Link tree berhasil ditambahkan!");
  });
});
