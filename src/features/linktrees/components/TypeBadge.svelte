<script>
  import { getTypeMeta } from "../constants.js";

  export let type = "";

  $: meta = getTypeMeta(type);
  $: classes = `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`;
</script>

<span data-testid="type-badge" class={classes}>
  {meta.label}
</span>
