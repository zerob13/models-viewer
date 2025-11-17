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
    <main class="content">
      <div class="window main-window">
        <div class="title-bar">
          <div class="title-bar-text">Models Viewer</div>
        </div>

        <section class="window-body window-content">
          <div class="toolbar">
            <div class="toolbar-left">
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
                <button type="button" aria-label="Refresh" @click="modelsStore.modelsQuery.refresh()">
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
                  {{ queryErrorMessage || '加载失败' }}
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

.search-box {
  flex: 1;
  min-width: 0;
  max-width: 400px;
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
