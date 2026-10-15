import { describe, it, expect, vi, beforeEach } from "vitest";
import linkTreeApi from "./linkTreeApi";
import apiHelper from "../../../helpers/apiHelper";

const BASE = `${DELCOM_BASEURL}/link-trees`;

function mockResponse(body) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({ json: async () => body });
}

describe("linkTreeApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postLinkTree", () => {
    it("should create link tree with title, type, and description", async () => {
      const spy = mockResponse({ status: "success", data: { link_tree_id: 10 } });

      const res = await linkTreeApi.postLinkTree("Judul", "public", "Deskripsi");

      expect(res).toEqual({ link_tree_id: 10 });
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Judul", type: "public", description: "Deskripsi" }),
      });
    });

    it("should throw API message when status is not success", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(linkTreeApi.postLinkTree("", "public", "")).rejects.toThrow("Data tidak valid");
    });

    it("should use fallback message when API gives none", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postLinkTree("", "public", "")).rejects.toThrow(
        "Gagal menambahkan link tree"
      );
    });
  });

  describe("postLinkTreeCover", () => {
    it("should upload cover with FormData and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil" });
      const file = new File(["x"], "cover.png", { type: "image/png" });

      const msg = await linkTreeApi.postLinkTreeCover(5, file);

      expect(msg).toBe("Berhasil");
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${BASE}/5/cover`);
      expect(options.method).toBe("POST");
      expect(options.body.get("cover").name).toBe("cover.png");
    });

    it("should fall back to cover.jpg when file has no name", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      const blob = new Blob(["x"], { type: "image/jpeg" });

      await linkTreeApi.postLinkTreeCover(5, blob);

      expect(spy.mock.calls[0][1].body.get("cover").name).toBe("cover.jpg");
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postLinkTreeCover(5, new File(["x"], "a.png"))).rejects.toThrow(
        "Gagal mengubah sampul"
      );
    });
  });

  describe("putLinkTree", () => {
    it("should update link tree and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Diubah" });

      const msg = await linkTreeApi.putLinkTree(3, "A", "private", "B");

      expect(msg).toBe("Diubah");
      expect(spy).toHaveBeenCalledWith(`${BASE}/3`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "A", type: "private", description: "B" }),
      });
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail", message: "Gagal total" });
      await expect(linkTreeApi.putLinkTree(3, "A", "public", "B")).rejects.toThrow("Gagal total");
    });
  });

  describe("getLinkTrees", () => {
    it("should return data.link_trees", async () => {
      const spy = mockResponse({ status: "success", data: { link_trees: [{ id: 1 }] } });

      expect(await linkTreeApi.getLinkTrees()).toEqual([{ id: 1 }]);
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "GET" });
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await linkTreeApi.getLinkTrees()).toEqual([]);
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow("Gagal mengambil data link tree");
    });
  });

  describe("getLinkTreeById", () => {
    it("should return link tree with nested items", async () => {
      const spy = mockResponse({
        status: "success",
        data: { link_tree: { id: 1, title: "A", items: [{ id: 9 }] } },
      });

      expect(await linkTreeApi.getLinkTreeById(1)).toEqual({
        id: 1,
        title: "A",
        items: [{ id: 9 }],
      });
      expect(spy).toHaveBeenCalledWith(`${BASE}/1`, { method: "GET" });
    });

    it("should read items placed beside link_tree in data", async () => {
      mockResponse({
        status: "success",
        data: { link_tree: { id: 1 }, items: [{ id: 2 }] },
      });

      expect((await linkTreeApi.getLinkTreeById(1)).items).toEqual([{ id: 2 }]);
    });

    it("should default items to an empty array", async () => {
      mockResponse({ status: "success", data: { link_tree: { id: 1 } } });

      expect((await linkTreeApi.getLinkTreeById(1)).items).toEqual([]);
    });

    it("should return undefined when link_tree is absent", async () => {
      mockResponse({ status: "success", data: {} });
      expect(await linkTreeApi.getLinkTreeById(1)).toBeUndefined();

      mockResponse({ status: "success" });
      expect(await linkTreeApi.getLinkTreeById(1)).toBeUndefined();
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.getLinkTreeById(1)).rejects.toThrow(
        "Gagal mengambil detail link tree"
      );
    });
  });

  describe("deleteLinkTree", () => {
    it("should delete a link tree", async () => {
      const spy = mockResponse({ status: "success", message: "Dihapus" });

      expect(await linkTreeApi.deleteLinkTree(4)).toBe("Dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/4`, { method: "DELETE" });
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteLinkTree(4)).rejects.toThrow("Gagal menghapus link tree");
    });
  });

  describe("deleteAllLinkTrees", () => {
    it("should delete all link trees", async () => {
      const spy = mockResponse({ status: "success", message: "Semua dihapus" });

      expect(await linkTreeApi.deleteAllLinkTrees()).toBe("Semua dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "DELETE" });
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow(
        "Gagal menghapus semua link tree"
      );
    });
  });

  describe("items", () => {
    it("postItem should add an item", async () => {
      const spy = mockResponse({ status: "success", message: "Item ditambah" });

      expect(await linkTreeApi.postItem(1, "GitHub", "https://github.com")).toBe("Item ditambah");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "GitHub", url: "https://github.com" }),
      });
    });

    it("postItem should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postItem(1, "a", "b")).rejects.toThrow("Gagal menambahkan tautan");
    });

    it("putItem should update an item", async () => {
      const spy = mockResponse({ status: "success", message: "Item diubah" });

      expect(await linkTreeApi.putItem(1, 7, "GH", "https://gh.io")).toBe("Item diubah");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/items/7`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "GH", url: "https://gh.io" }),
      });
    });

    it("putItem should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.putItem(1, 7, "a", "b")).rejects.toThrow("Gagal mengubah tautan");
    });

    it("deleteItem should delete an item", async () => {
      const spy = mockResponse({ status: "success", message: "Item dihapus" });

      expect(await linkTreeApi.deleteItem(1, 7)).toBe("Item dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/items/7`, { method: "DELETE" });
    });

    it("deleteItem should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteItem(1, 7)).rejects.toThrow("Gagal menghapus tautan");
    });
  });
});
