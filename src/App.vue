<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useModelsStore } from './stores/models'

const modelsStore = useModelsStore()
const { filteredModels, models, providers, searchTerm, selectedProviderId } = storeToRefs(modelsStore)

const scrollContainer = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(0)

const rowHeight = 90
const buffer = 6

const totalHeight = computed(() => filteredModels.value.length * rowHeight)
const startIndex = computed(() => Math.max(Math.floor(scrollTop.value / rowHeight) - buffer, 0))
const visibleCount = computed(() => Math.ceil(viewportHeight.value / rowHeight) + buffer * 2)
const endIndex = computed(() => Math.min(startIndex.value + visibleCount.value, filteredModels.value.length))
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

const queryErrorMessage = computed(() => {
  const err = modelsStore.modelsQuery.error.value
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
    <header class="title-bar hero-bar">
      <div class="title-bar-text">Models Viewer</div>
      <div class="search-box">
        <input v-model="searchTerm" type="search" class="search-input"
          placeholder="Search by model id or model name..." />
      </div>
      <div class="bar-actions">
        <select v-model="selectedProviderId" class="provider-select" aria-label="Filter by provider">
          <option value="all">All providers</option>
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </div>
    </header>

    <main class="content">
      <div class="window main-window">
        <div class="title-bar mini-bar">
          <div class="title-bar-text">Model catalog</div>
          <div class="title-bar-controls">
            <button type="button" aria-label="Refresh" @click="modelsStore.modelsQuery.refresh()">
              <Icon icon="mdi:refresh" width="14" />
            </button>
          </div>
        </div>

        <section class="window-body window-content">
          <div class="meta">
            <div class="meta-line">
              <strong>{{ filteredModels.length }}</strong>
              / {{ models.length }} models matched
            </div>
            <div class="status" :class="{ danger: modelsStore.modelsQuery.error }">
              <span v-if="modelsStore.modelsQuery.isPending">Loading latest models…</span>
              <span v-else-if="modelsStore.modelsQuery.error">
                {{ queryErrorMessage || '加载失败' }}
              </span>
              <span v-else>Up to date</span>
            </div>
          </div>

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

            <div ref="scrollContainer" class="table-body" role="presentation" @scroll="handleScroll">
              <div class="virtual-list-container" :style="{ height: `${totalHeight}px` }">
                <div class="virtual-list" :style="{ transform: `translateY(${translateY}px)` }">
                  <article v-for="model in visibleModels" :key="`${model.providerId}-${model.modelId}`"
                    class="table-row">
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
                      <span v-if="model.capabilities.reasoning" class="icon-chip" title="Reasoning">
                        <Icon icon="mdi:brain" width="18" />
                      </span>
                      <span v-if="model.capabilities.toolCall" class="icon-chip" title="Tool call">
                        <Icon icon="mdi:tools" width="18" />
                      </span>
                      <span v-if="model.capabilities.attachment" class="icon-chip" title="Attachments">
                        <Icon icon="mdi:paperclip" width="18" />
                      </span>
                      <span v-if="model.capabilities.temperature" class="icon-chip" title="Sampling">
                        <Icon icon="mdi:thermometer" width="18" />
                      </span>
                      <span v-if="model.capabilities.multimodal" class="icon-chip" title="Images">
                        <Icon icon="mdi:image-multiple" width="18" />
                      </span>
                      <span v-if="!Object.values(model.capabilities).some(Boolean)" class="muted">—</span>
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
                        <span class="tag" v-for="input in model.modalities.input" :key="`in-${input}`">
                          IN: {{ input }}
                        </span>
                        <span class="tag subtle" v-for="output in model.modalities.output" :key="`out-${output}`">
                          OUT: {{ output }}
                        </span>
                        <span v-if="!model.modalities.input.length && !model.modalities.output.length">
                          —
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
              <div v-if="!modelsStore.modelsQuery.isPending && !filteredModels.length" class="empty">
                No models match this search. Try a different id or name.
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
  gap: 12px;
  padding: 16px;
  max-width: 1280px;
  margin: 0 auto;
}

.hero-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 180px 1fr 240px;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
  min-height: 90px;
  background: var(--window-bg);
  border: 1px solid var(--border-strong);
  box-shadow:
    inset 0 1px 0 #fff,
    0 6px 12px rgba(0, 0, 0, 0.12);
}

.search-box {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 15px;
  border: 1px solid #7f9db9;
  border-radius: 6px;
  background: #fff;
}

.bar-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.provider-select {
  height: 38px;
  border-radius: 6px;
  border: 1px solid #7f9db9;
  padding: 0 10px;
  background: #fff;
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

.mini-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--window-bg);
  color: var(--app-text);
  overflow: hidden;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: var(--muted);
}

.status.danger {
  color: #d32f2f;
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
  overflow: auto;
  background: #e6edf7;
}

.virtual-list-container {
  position: relative;
}

.table-row {
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
  width: 100%;
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
