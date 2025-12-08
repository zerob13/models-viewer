<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useModelsStore } from './stores/models'

const modelsStore = useModelsStore()
const { filteredModels, models, providers, searchTerm, selectedProviderId } =
  storeToRefs(modelsStore)

const scrollContainer = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(0)

const rowHeight = 90
const buffer = 6

const totalHeight = computed(() => filteredModels.value.length * rowHeight)
const startIndex = computed(() => Math.max(Math.floor(scrollTop.value / rowHeight) - buffer, 0))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / rowHeight) + buffer * 2)
const endIndex = computed(() =>
  Math.min(startIndex.value + visibleCount.value, filteredModels.value.length),
)
const visibleModels = computed(() => filteredModels.value.slice(startIndex.value, endIndex.value))
const translateY = computed(() => startIndex.value * rowHeight)

const updateViewport = () => {
  viewportHeight.value = scrollContainer.value?.clientHeight ?? 0
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateViewport()
  if (scrollContainer.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateViewport)
    resizeObserver.observe(scrollContainer.value)
  } else {
    window.addEventListener('resize', updateViewport)
  }
})

watch(
  () => scrollContainer.value,
  (el, _old, onCleanup) => {
    if (!el) return
    updateViewport()
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(updateViewport)
      ro.observe(el)
      onCleanup(() => ro.disconnect())
    }
  },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateViewport)
})

watch(
  () => [searchTerm.value, selectedProviderId.value],
  () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0
      scrollTop.value = 0
    }
  },
)

const showHowTo = ref(false)

const queryErrorMessage = computed(() => {
  const err = modelsStore.modelsQuery.error
  if (!err) return ''
  if (err instanceof Error) return err.message
  return String(err)
})

const formatNumber = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString()
}

const formatCurrency = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${value}`
}
</script>

<template>
  <div class="app-shell">
    <section class="intro-section window">
      <div class="title-bar">
        <div class="title-bar-text">PublicProviderConf</div>
      </div>
      <div class="window-body intro-body">
        <p class="intro-blurb">
          An open collection of model/provider configs built on
          <a href="https://models.dev/" target="_blank" rel="noreferrer">models.dev</a> and extended
          with providers like Ollama.
        </p>
        <div class="intro-actions">
          <a
            class="link-chip"
            href="https://github.com/ThinkInAIXYZ/PublicProviderConf"
            target="_blank"
            rel="noreferrer"
          >
            Fork me on GitHub
          </a>
          <button class="link-chip secondary" type="button" @click="showHowTo = true">
            How to use
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="showHowTo"
      class="modal-backdrop"
      role="presentation"
      @click.self="showHowTo = false"
    >
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="How to use PublicProviderConf"
      >
        <div class="modal-header">
          <div class="title-stack">
            <span class="pill">Guide</span>
            <div>
              <h3>How to use</h3>
              <p class="subhead">
                Fetch JSON endpoints or target a provider-specific file in your tooling.
              </p>
            </div>
          </div>
          <button class="close-btn" type="button" aria-label="Close" @click="showHowTo = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="callout">
            <Icon icon="mdi:lightbulb-on-outline" width="18" />
            <div>
              <strong>Quick start</strong>
              <p class="muted">
                Use the public JSON feeds below to hydrate configs or seed provider catalogs; they
                update alongside the data project.
              </p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <div class="block-heading">
                <span class="pill quiet">Endpoints</span>
                <h4>API JSON feeds</h4>
                <p class="muted">Direct links to the raw datasets.</p>
              </div>
              <ul class="link-list">
                <li>
                  <a
                    href="https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/all.json"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Full model list (all.json)
                  </a>
                </li>
                <li>
                  <a
                    href="https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/deepseek.json"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Provider example: deepseek.json
                  </a>
                </li>
              </ul>
            </div>

            <div class="info-block">
              <div class="block-heading">
                <span class="pill quiet">CLI</span>
                <h4>curl quick copy</h4>
                <p class="muted">Drop these into scripts or tests.</p>
              </div>
              <div class="code-block">
                <code
                  >curl
                  https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/all.json</code
                >
              </div>
              <div class="code-block">
                <code
                  >curl
                  https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/deepseek.json</code
                >
              </div>
            </div>

            <div class="info-block">
              <div class="block-heading">
                <span class="pill quiet">Community</span>
                <h4>Contributions</h4>
                <p class="muted">Data + UI live in separate repos.</p>
              </div>
              <ul class="link-list">
                <li>
                  Data project:
                  <a
                    href="https://github.com/ThinkInAIXYZ/PublicProviderConf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ThinkInAIXYZ/PublicProviderConf
                  </a>
                </li>
                <li>
                  Frontend project:
                  <a
                    href="https://github.com/zerob13/models-viewer"
                    target="_blank"
                    rel="noreferrer"
                  >
                    zerob13/models-viewer
                  </a>
                </li>
              </ul>
              <h4>Thanks</h4>
              <p class="muted">
                Thanks to
                <a href="https://models.dev/" target="_blank" rel="noreferrer">models.dev</a> for
                the base data; this project extends it and keeps it open, adding providers like
                Ollama.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <div class="pill quiet">Tip</div>
            <p class="muted">
              Swap <code>deepseek</code> with any provider id to fetch its JSON, or use
              <code>all.json</code> to sync everything at once.
            </p>
          </div>
        </div>
      </div>
    </div>

    <main class="content">
      <div class="window main-window">
        <div class="title-bar">
          <div class="title-bar-text">Models Viewer</div>
        </div>

        <section class="window-body window-content">
          <div class="toolbar">
            <div class="toolbar-left">
              <div class="search-box">
                <input
                  v-model="searchTerm"
                  type="search"
                  class="search-input"
                  placeholder="Search by model id or model name..."
                />
              </div>
              <div class="bar-actions">
                <select
                  v-model="selectedProviderId"
                  class="provider-select"
                  aria-label="Filter by provider"
                >
                  <option value="all">All providers</option>
                  <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                    {{ provider.name }}
                  </option>
                </select>
                <button
                  type="button"
                  aria-label="Refresh"
                  @click="modelsStore.modelsQuery.refresh()"
                >
                  <Icon icon="mdi:refresh" width="14" />
                </button>
              </div>
            </div>
            <div class="toolbar-right">
              <div class="meta-line">
                <strong>{{ filteredModels.length }}</strong>
                / {{ models.length }} models matched
              </div>
              <div class="status" :class="{ danger: modelsStore.modelsQuery.error }">
                <span v-if="modelsStore.modelsQuery.isPending">Loading latest models…</span>
                <span v-else-if="modelsStore.modelsQuery.error">
                  {{ queryErrorMessage || 'Load failed' }}
                </span>
                <span v-else>Up to date</span>
              </div>
            </div>
          </div>

          <div class="table-wrapper">
            <div class="table">
              <div class="table-header">
                <div class="cell provider">Provider</div>
                <div class="cell id">Model ID</div>
                <div class="cell name">Name</div>
                <div class="cell capabilities">Capabilities</div>
                <div class="cell limits">Limits</div>
                <div class="cell cost">Cost</div>
                <div class="cell modalities">Modalities</div>
              </div>

              <div
                ref="scrollContainer"
                class="table-body"
                role="presentation"
                @scroll="handleScroll"
              >
                <div class="virtual-list-container" :style="{ height: `${totalHeight}px` }">
                  <div class="virtual-list" :style="{ transform: `translateY(${translateY}px)` }">
                    <article
                      v-for="model in visibleModels"
                      :key="`${model.providerId}-${model.modelId}`"
                      class="table-row"
                    >
                      <div class="cell provider">
                        <div class="provider-name">{{ model.providerDisplayName }}</div>
                        <code class="provider-id">{{ model.providerId }}</code>
                      </div>
                      <div class="cell id">
                        <code>{{ model.modelId }}</code>
                      </div>
                      <div class="cell name">
                        <div class="model-name">{{ model.modelDisplayName }}</div>
                        <div class="muted">{{ model.modelName }}</div>
                      </div>
                      <div class="cell capabilities icons">
                        <span
                          v-if="model.capabilities.reasoning"
                          class="icon-chip"
                          title="Reasoning"
                        >
                          <Icon icon="mdi:brain" width="18" />
                        </span>
                        <span
                          v-if="model.capabilities.toolCall"
                          class="icon-chip"
                          title="Tool call"
                        >
                          <Icon icon="mdi:tools" width="18" />
                        </span>
                        <span
                          v-if="model.capabilities.attachment"
                          class="icon-chip"
                          title="Attachments"
                        >
                          <Icon icon="mdi:paperclip" width="18" />
                        </span>
                        <span
                          v-if="model.capabilities.temperature"
                          class="icon-chip"
                          title="Sampling"
                        >
                          <Icon icon="mdi:thermometer" width="18" />
                        </span>
                        <span v-if="model.capabilities.multimodal" class="icon-chip" title="Images">
                          <Icon icon="mdi:image-multiple" width="18" />
                        </span>
                        <span v-if="!Object.values(model.capabilities).some(Boolean)" class="muted"
                          >—</span
                        >
                      </div>
                      <div class="cell limits">
                        <div>Context: {{ formatNumber(model.limits.context) }}</div>
                        <div>Output: {{ formatNumber(model.limits.output) }}</div>
                      </div>
                      <div class="cell cost">
                        <div>Input: {{ formatCurrency(model.cost.input) }}</div>
                        <div>Output: {{ formatCurrency(model.cost.output) }}</div>
                      </div>
                      <div class="cell modalities">
                        <div class="tag-group">
                          <span
                            class="tag"
                            v-for="input in model.modalities.input"
                            :key="`in-${input}`"
                          >
                            IN: {{ input }}
                          </span>
                          <span
                            class="tag subtle"
                            v-for="output in model.modalities.output"
                            :key="`out-${output}`"
                          >
                            OUT: {{ output }}
                          </span>
                          <span
                            v-if="!model.modalities.input.length && !model.modalities.output.length"
                          >
                            —
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
                <div
                  v-if="!modelsStore.modelsQuery.isPending && !filteredModels.length"
                  class="empty"
                >
                  No models match this search. Try a different id or name.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  max-width: 1280px;
  margin: 0 auto;
}

.intro-section {
  margin-bottom: 16px;
  border: 1px solid var(--border-strong);
  background: var(--window-bg);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.12);
}

.intro-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.intro-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.intro-blurb {
  margin: 0;
}

.link-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  background: rgba(0, 84, 227, 0.08);
  text-decoration: none;
  font-weight: 600;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}

.link-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 84, 227, 0.16);
}

.link-chip.secondary {
  background: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.info-block {
  position: relative;
  padding: 12px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff, #f2f6ff);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 10px;
  overflow: hidden;
}

.info-block::before {
  content: '';
  position: absolute;
  inset: -42% auto auto -28%;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle at 30% 30%, rgba(0, 84, 227, 0.22), transparent 65%);
  opacity: 0.6;
  transform: rotate(12deg);
  pointer-events: none;
}

.block-heading {
  position: relative;
  display: grid;
  gap: 6px;
}

.info-block h4 {
  margin: 10px 0 6px;
}

.block-heading h4 {
  margin: 0;
}

.block-heading p {
  margin: 0;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.link-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.link-list li::before {
  content: '↗';
  color: var(--accent);
  font-size: 13px;
  line-height: 1.2;
}

.code-block {
  background: #0f172a;
  color: #e5edf7;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #0b1220;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 22px rgba(0, 0, 0, 0.18);
  font-family:
    'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  margin-bottom: 8px;
}

.title-stack {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: linear-gradient(135deg, #ffffff, #e7eeff);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 800;
  color: var(--accent);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.pill.quiet {
  background: rgba(0, 84, 227, 0.08);
  color: var(--muted);
  box-shadow: none;
}

.subhead {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  max-width: 560px;
}

.search-box {
  flex: 1;
  min-width: 0;
  max-width: 400px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(120% 120% at 12% 12%, rgba(0, 84, 227, 0.18), transparent 40%),
    rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 10;
}

.modal-card {
  position: relative;
  width: min(960px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: var(--window-bg);
  box-shadow:
    16px 18px 0 rgba(0, 0, 0, 0.14),
    0 18px 48px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: modalIn 160ms ease-out;
}

.modal-card::after {
  content: '';
  position: absolute;
  inset: -40% 10% auto auto;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle at 60% 30%, rgba(0, 84, 227, 0.16), transparent 60%);
  opacity: 0.6;
  pointer-events: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-strong);
  background: linear-gradient(120deg, #e9f0ff 0%, #f8fbff 100%);
}

.modal-header h3 {
  margin: 0;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow: auto;
  min-height: 0;
}

.close-btn {
  border: 1px solid var(--border-strong);
  background: linear-gradient(180deg, #ffffff 0%, #e8eefc 100%);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}

.close-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(0, 84, 227, 0.18);
}

.callout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: linear-gradient(120deg, #f8fbff 0%, #eef3ff 100%);
  box-shadow: 0 10px 30px rgba(0, 84, 227, 0.08);
}

.callout svg {
  color: var(--accent);
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: rgba(0, 84, 227, 0.06);
}

@keyframes modalIn {
  from {
    transform: translateY(6px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #7f9db9;
  border-radius: 3px;
  background: #fff;
}

.bar-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.bar-actions button {
  min-width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.content {
  flex: 1;
}

.main-window {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--window-bg);
  border: 1px solid var(--border-strong);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.12);
}

.window-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--window-bg);
  color: var(--app-text);
  overflow: hidden;
  min-height: 0;
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--border-strong);
  background: #f0f4f8;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.meta-line {
  color: var(--muted);
  font-size: 13px;
}

.status.danger {
  color: #d32f2f;
}

.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 12px;
}

.table {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-strong);
  overflow: hidden;
  border-radius: 6px;
  background: #f4f7fb;
  min-height: 0;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.2fr 1.1fr 1.3fr 1fr 1fr 1fr 1.1fr;
  gap: 6px;
  padding: 10px 12px;
}

.table-header {
  flex-shrink: 0;
  font-weight: 700;
  background: #dbe6f7;
  border-bottom: 1px solid var(--border-strong);
}

.table-body {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #e6edf7;
}

.virtual-list-container {
  position: relative;
}

.table-row {
  width: 100%;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
  height: 90px;
  align-items: center;
  background: #f8fbff;
}

.table-row:hover {
  background: rgba(0, 84, 227, 0.08);
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.icons {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.provider-name {
  font-weight: 600;
}

.provider-id {
  color: var(--muted);
}

.model-name {
  font-weight: 600;
}

.muted {
  color: var(--muted);
  font-size: 13px;
}

.icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(0, 84, 227, 0.12);
  border: 1px solid var(--border-strong);
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(0, 84, 227, 0.12);
  border: 1px solid var(--border-strong);
  font-size: 12px;
}

.tag.subtle {
  background: rgba(0, 0, 0, 0.05);
}

.virtual-list {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-weight: 600;
}
</style>
