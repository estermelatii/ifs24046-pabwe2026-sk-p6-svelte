<script>
  import { onMount } from "svelte";
  import { navigate } from "../../../router.js";
  import AddModal from "../modals/AddModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import TypeBadge from "../components/TypeBadge.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    Plus,
    Link,
    Globe,
    EyeOff,
    Lock,
    Eye,
    Pencil,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
  } from "lucide-svelte";

  let loadingLinkTrees = false;
  let onlyMine = false;
  let searchQuery = "";
  let showAddModal = false;
  let showChangeModal = false;
  let selectedLinkTreeId = null;

  $: profile = $usersStore.profile;
  $: linkTrees = $linkTreesStore.linkTrees || [];

  onMount(() => {
    loadLinkTrees();
  });

  function loadLinkTrees() {
    loadingLinkTrees = true;
    Promise.resolve(linkTreesStore.asyncSetLinkTrees()).finally(() => {
      loadingLinkTrees = false;
    });
  }

  $: if ($linkTreesStore.isLinkTreeDeleted) {
    linkTreesStore.setIsLinkTreeDeleted(false);
    loadLinkTrees();
  }

  $: if ($linkTreesStore.isLinkTreeDeletedAll) {
    linkTreesStore.setIsLinkTreeDeletedAll(false);
    loadLinkTrees();
  }

  function handleEdit(linkTreeId) {
    selectedLinkTreeId = linkTreeId;
    showChangeModal = true;
  }

  async function handleDelete(linkTreeId) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus link tree ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTreeId);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Apakah Anda yakin ingin menghapus SEMUA link tree? Tindakan ini tidak dapat dibatalkan."
    );
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDeleteAll();
    }
  }

  $: filteredLinkTrees = linkTrees.filter((linkTree) => {
    if (onlyMine && linkTree.user_id !== profile?.id) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = linkTree.title ? linkTree.title.toLowerCase() : "";
    const description = linkTree.description ? linkTree.description.toLowerCase() : "";
    return title.includes(q) || description.includes(q);
  });

  $: totalCount = linkTrees.length;
  $: publicCount = linkTrees.filter((l) => l.type === "public").length;
  $: unlistedCount = linkTrees.filter((l) => l.type === "unlisted").length;
  $: privateCount = linkTrees.filter((l) => l.type === "private").length;
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Daftar Link Tree
        </h1>
        <p class="text-sm text-slate-600 mt-1">
          Kelola kumpulan tautan penting Anda dalam satu tempat.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        {#if totalCount > 0}
          <button
            type="button"
            data-testid="delete-all-btn"
            on:click={handleDeleteAll}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
          >
            <Trash2 size={18} />
            <span>Hapus Semua</span>
          </button>
        {/if}
        <button
          type="button"
          data-testid="add-linktree-btn"
          on:click={() => (showAddModal = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Link Tree</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Total</p>
          <p data-testid="stat-total" class="text-3xl font-black text-slate-800 mt-1">{totalCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Link size={26} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Publik</p>
          <p data-testid="stat-public" class="text-3xl font-black text-emerald-700 mt-1">{publicCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Globe size={26} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Tidak Terdaftar</p>
          <p data-testid="stat-unlisted" class="text-3xl font-black text-amber-700 mt-1">{unlistedCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
          <EyeOff size={26} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Privat</p>
          <p data-testid="stat-private" class="text-3xl font-black text-slate-600 mt-1">{privateCount}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <Lock size={26} />
        </div>
      </div>
    </div>

    <!-- Table & Controls -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            data-testid="search-linktree-input"
            bind:value={searchQuery}
            placeholder="Cari judul atau deskripsi link tree..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5">
          <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Funnel size={16} /> Filter:
          </span>
          <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              data-testid="filter-all-btn"
              on:click={() => (onlyMine = false)}
              class="px-3 py-1.5 rounded-lg transition-all {!onlyMine ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
            >
              Semua
            </button>
            <button
              type="button"
              data-testid="filter-mine-btn"
              on:click={() => (onlyMine = true)}
              class="px-3 py-1.5 rounded-lg transition-all {onlyMine ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
            >
              Milik Saya
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-600 border-b border-slate-100">
            <tr>
              <th class="px-5 py-3.5 text-center w-16">ID</th>
              <th class="px-5 py-3.5">Judul</th>
              <th class="px-5 py-3.5 hidden md:table-cell">Dibuat</th>
              <th class="px-5 py-3.5 hidden lg:table-cell">Diperbarui</th>
              <th class="px-5 py-3.5">Tipe</th>
              <th class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#if loadingLinkTrees && filteredLinkTrees.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-600">
                  <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
                  <p class="font-medium text-slate-600">Memuat daftar link tree...</p>
                </td>
              </tr>
            {:else if filteredLinkTrees.length === 0}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-600">
                  <Link size={40} class="mx-auto text-slate-300 mb-2" />
                  <p class="font-medium">Belum ada data link tree yang cocok.</p>
                </td>
              </tr>
            {:else}
              {#each filteredLinkTrees as linkTree (linkTree.id)}
                <tr
                  data-testid={`linktree-row-${linkTree.id}`}
                  class="hover:bg-slate-50/70 transition-colors group"
                >
                  <td class="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600">
                    {"#" + linkTree.id}
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      {#if linkTree.cover}
                        <img
                          src={linkTree.cover}
                          alt={linkTree.title}
                          class="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      {/if}
                      <div>
                        <p class="font-semibold text-slate-800 leading-snug">{linkTree.title}</p>
                        {#if linkTree.description}
                          <p class="text-xs text-slate-600 line-clamp-1 mt-0.5">{linkTree.description}</p>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4 hidden md:table-cell text-xs text-slate-600">
                    {formatDate(linkTree.created_at)}
                  </td>
                  <td class="px-5 py-4 hidden lg:table-cell text-xs text-slate-600">
                    {formatDate(linkTree.updated_at)}
                  </td>
                  <td class="px-5 py-4">
                    <TypeBadge type={linkTree.type} />
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        data-testid={`view-linktree-${linkTree.id}`}
                        on:click={() => navigate(`/link-trees/${linkTree.id}`)}
                        class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        type="button"
                        data-testid={`edit-linktree-${linkTree.id}`}
                        on:click={() => handleEdit(linkTree.id)}
                        class="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ubah Link Tree"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-linktree-${linkTree.id}`}
                        on:click={() => handleDelete(linkTree.id)}
                        class="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Link Tree"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <AddModal show={showAddModal} on:close={() => (showAddModal = false)} />
    <ChangeModal
      show={showChangeModal}
      linkTreeId={selectedLinkTreeId}
      on:close={() => (showChangeModal = false)}
    />
  </div>
{/if}
