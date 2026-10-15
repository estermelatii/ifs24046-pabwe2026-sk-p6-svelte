import { writable } from "svelte/store";
import linkTreeApi from "../api/linkTreeApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

function createLinkTreesStore() {
  const initial = {
    linkTrees: [],
    linkTree: null,
    isLinkTree: false,
    isLinkTreeAdd: false,
    isLinkTreeAdded: false,
    isLinkTreeChange: false,
    isLinkTreeChanged: false,
    isLinkTreeChangeCover: false,
    isLinkTreeChangedCover: false,
    isLinkTreeDelete: false,
    isLinkTreeDeleted: false,
    isLinkTreeDeleteAll: false,
    isLinkTreeDeletedAll: false,
    isItemAdd: false,
    isItemAdded: false,
    isItemChange: false,
    isItemChanged: false,
    isItemDelete: false,
    isItemDeleted: false,
  };

  let currentState = { ...initial };
  const innerStore = writable(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  const setter = (key) => (value) =>
    innerStore.update((s) => ({ ...s, [key]: value }));

  // Pola mutasi yang sama untuk semua aksi tambah/ubah/hapus:
  // panggil API, tampilkan dialog, set bendera hasil lalu bendera selesai.
  async function mutate(call, successFallback, setDone, setFinish) {
    try {
      const message = await call();
      showSuccessDialog(message || successFallback);
      setDone(true);
    } catch (error) {
      showErrorDialog(error.message);
      setDone(false);
    } finally {
      setFinish(true);
    }
  }

  const store = {
    subscribe: innerStore.subscribe,
    get $state() {
      return currentState;
    },
    reset(state = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setLinkTrees: setter("linkTrees"),
    setLinkTree: setter("linkTree"),
    setIsLinkTree: setter("isLinkTree"),
    setIsLinkTreeAdd: setter("isLinkTreeAdd"),
    setIsLinkTreeAdded: setter("isLinkTreeAdded"),
    setIsLinkTreeChange: setter("isLinkTreeChange"),
    setIsLinkTreeChanged: setter("isLinkTreeChanged"),
    setIsLinkTreeChangeCover: setter("isLinkTreeChangeCover"),
    setIsLinkTreeChangedCover: setter("isLinkTreeChangedCover"),
    setIsLinkTreeDelete: setter("isLinkTreeDelete"),
    setIsLinkTreeDeleted: setter("isLinkTreeDeleted"),
    setIsLinkTreeDeleteAll: setter("isLinkTreeDeleteAll"),
    setIsLinkTreeDeletedAll: setter("isLinkTreeDeletedAll"),
    setIsItemAdd: setter("isItemAdd"),
    setIsItemAdded: setter("isItemAdded"),
    setIsItemChange: setter("isItemChange"),
    setIsItemChanged: setter("isItemChanged"),
    setIsItemDelete: setter("isItemDelete"),
    setIsItemDeleted: setter("isItemDeleted"),

    async asyncSetLinkTrees() {
      try {
        this.setLinkTrees(await linkTreeApi.getLinkTrees());
      } catch {
        this.setLinkTrees([]);
      }
    },
    async asyncSetLinkTree(linkTreeId) {
      try {
        this.setLinkTree(await linkTreeApi.getLinkTreeById(linkTreeId));
      } catch {
        this.setLinkTree(null);
      } finally {
        this.setIsLinkTree(true);
      }
    },
    async asyncSetIsLinkTreeAdd(title, type, description) {
      await mutate(
        async () => {
          await linkTreeApi.postLinkTree(title, type, description);
        },
        "Link tree berhasil ditambahkan!",
        this.setIsLinkTreeAdded,
        this.setIsLinkTreeAdd
      );
    },
    async asyncSetIsLinkTreeChange(linkTreeId, title, type, description) {
      await mutate(
        () => linkTreeApi.putLinkTree(linkTreeId, title, type, description),
        "Link tree berhasil diperbarui!",
        this.setIsLinkTreeChanged,
        this.setIsLinkTreeChange
      );
    },
    async asyncSetIsLinkTreeChangeCover(linkTreeId, cover) {
      await mutate(
        () => linkTreeApi.postLinkTreeCover(linkTreeId, cover),
        "Sampul berhasil diperbarui!",
        this.setIsLinkTreeChangedCover,
        this.setIsLinkTreeChangeCover
      );
    },
    async asyncSetIsLinkTreeDelete(linkTreeId) {
      await mutate(
        () => linkTreeApi.deleteLinkTree(linkTreeId),
        "Link tree berhasil dihapus!",
        this.setIsLinkTreeDeleted,
        this.setIsLinkTreeDelete
      );
    },
    async asyncSetIsLinkTreeDeleteAll() {
      await mutate(
        () => linkTreeApi.deleteAllLinkTrees(),
        "Semua link tree berhasil dihapus!",
        this.setIsLinkTreeDeletedAll,
        this.setIsLinkTreeDeleteAll
      );
    },
    async asyncSetIsItemAdd(linkTreeId, title, url) {
      await mutate(
        () => linkTreeApi.postItem(linkTreeId, title, url),
        "Tautan berhasil ditambahkan!",
        this.setIsItemAdded,
        this.setIsItemAdd
      );
    },
    async asyncSetIsItemChange(linkTreeId, itemId, title, url) {
      await mutate(
        () => linkTreeApi.putItem(linkTreeId, itemId, title, url),
        "Tautan berhasil diperbarui!",
        this.setIsItemChanged,
        this.setIsItemChange
      );
    },
    async asyncSetIsItemDelete(linkTreeId, itemId) {
      await mutate(
        () => linkTreeApi.deleteItem(linkTreeId, itemId),
        "Tautan berhasil dihapus!",
        this.setIsItemDeleted,
        this.setIsItemDelete
      );
    },
  };

  return store;
}

export const linkTreesStore = createLinkTreesStore();
export const useLinkTreesStore = () => linkTreesStore;
export default linkTreesStore;
