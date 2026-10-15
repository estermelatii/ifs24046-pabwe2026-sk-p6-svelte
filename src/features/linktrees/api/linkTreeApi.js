import apiHelper from "../../../helpers/apiHelper";

const linkTreeApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/link-trees`;

  function _url(path) {
    return BASE_URL + path;
  }

  const JSON_HEADERS = { "Content-Type": "application/json" };

  // Pembungkus tunggal: kirim request, baca JSON, dan lempar error bila status bukan "success".
  async function request(path, options, fallbackMessage) {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  async function postLinkTree(title, type, description) {
    const result = await request(
      "/",
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, type, description }),
      },
      "Gagal menambahkan link tree"
    );
    return result.data;
  }

  async function postLinkTreeCover(linkTreeId, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await request(
      `/${linkTreeId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul"
    );
    return result.message;
  }

  async function putLinkTree(linkTreeId, title, type, description) {
    const result = await request(
      `/${linkTreeId}`,
      {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, type, description }),
      },
      "Gagal mengubah link tree"
    );
    return result.message;
  }

  async function getLinkTrees() {
    const result = await request(
      "/",
      { method: "GET" },
      "Gagal mengambil data link tree"
    );
    return result.data?.link_trees || [];
  }

  async function getLinkTreeById(linkTreeId) {
    const result = await request(
      `/${linkTreeId}`,
      { method: "GET" },
      "Gagal mengambil detail link tree"
    );
    const linkTree = result.data?.link_tree;
    if (!linkTree) return undefined;
    // Item bisa berada di dalam link_tree atau sejajar dengannya di dalam data.
    const items = linkTree.items || result.data.items || [];
    return { ...linkTree, items };
  }

  async function deleteLinkTree(linkTreeId) {
    const result = await request(
      `/${linkTreeId}`,
      { method: "DELETE" },
      "Gagal menghapus link tree"
    );
    return result.message;
  }

  async function deleteAllLinkTrees() {
    const result = await request(
      "/",
      { method: "DELETE" },
      "Gagal menghapus semua link tree"
    );
    return result.message;
  }

  async function postItem(linkTreeId, title, url) {
    const result = await request(
      `/${linkTreeId}/items`,
      {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, url }),
      },
      "Gagal menambahkan tautan"
    );
    return result.message;
  }

  async function putItem(linkTreeId, itemId, title, url) {
    const result = await request(
      `/${linkTreeId}/items/${itemId}`,
      {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title, url }),
      },
      "Gagal mengubah tautan"
    );
    return result.message;
  }

  async function deleteItem(linkTreeId, itemId) {
    const result = await request(
      `/${linkTreeId}/items/${itemId}`,
      { method: "DELETE" },
      "Gagal menghapus tautan"
    );
    return result.message;
  }

  return {
    postLinkTree,
    postLinkTreeCover,
    putLinkTree,
    getLinkTrees,
    getLinkTreeById,
    deleteLinkTree,
    deleteAllLinkTrees,
    postItem,
    putItem,
    deleteItem,
  };
})();

export default linkTreeApi;
