export const LINK_TREE_TYPES = [
  {
    value: "public",
    label: "Publik",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "unlisted",
    label: "Tidak Terdaftar",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "private",
    label: "Privat",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export function getTypeMeta(type) {
  const found = LINK_TREE_TYPES.find((t) => t.value === type);
  if (found) return found;
  return {
    value: type,
    label: type || "-",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  };
}
