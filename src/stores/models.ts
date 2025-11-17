import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useQuery } from '@pinia/colada'

interface RawProviderModel {
  id: string
  name?: string
  display_name?: string
  attachment?: boolean
  reasoning?: { supported?: boolean }
  tool_call?: boolean
  temperature?: boolean
  modalities?: { input?: string[]; output?: string[] }
  open_weights?: boolean
  cost?: { input?: number; output?: number; cache_read?: number }
  limit?: { context?: number; output?: number }
}

interface RawProvider {
  id: string
  api?: string
  name?: string
  display_name?: string
  doc?: string
  models?: RawProviderModel[]
}

interface ProvidersResponse {
  providers: Record<string, RawProvider>
}

export interface NormalizedModel {
  providerId: string
  providerName: string
  providerDisplayName: string
  providerApi?: string
  providerDoc?: string
  modelId: string
  modelName: string
  modelDisplayName: string
  capabilities: {
    reasoning: boolean
    toolCall: boolean
    attachment: boolean
    temperature: boolean
    multimodal: boolean
  }
  modalities: { input: string[]; output: string[] }
  limits: { context: number | null; output: number | null }
  cost: { input: number | null; output: number | null; cacheRead: number | null }
}

const MODELS_URL =
  'https://raw.githubusercontent.com/ThinkInAIXYZ/PublicProviderConf/refs/heads/dev/dist/all.json'

const normalizeProviders = (payload: ProvidersResponse | undefined): NormalizedModel[] => {
  if (!payload?.providers) return []

  return Object.values(payload.providers).flatMap((provider) => {
    const providerDisplayName = provider.display_name ?? provider.name ?? provider.id
    return (provider.models ?? []).map((model) => {
      const multimodal =
        Boolean(model.modalities?.input?.includes('image')) ||
        Boolean(model.modalities?.output?.includes('image'))

      return {
        providerId: provider.id,
        providerName: provider.name ?? providerDisplayName,
        providerDisplayName,
        providerApi: provider.api,
        providerDoc: provider.doc,
        modelId: model.id,
        modelName: model.name ?? model.display_name ?? model.id,
        modelDisplayName: model.display_name ?? model.name ?? model.id,
        capabilities: {
          reasoning: Boolean(model.reasoning?.supported),
          toolCall: Boolean(model.tool_call),
          attachment: Boolean(model.attachment),
          temperature: Boolean(model.temperature),
          multimodal,
        },
        modalities: {
          input: model.modalities?.input ?? [],
          output: model.modalities?.output ?? [],
        },
        limits: {
          context: model.limit?.context ?? null,
          output: model.limit?.output ?? null,
        },
        cost: {
          input: model.cost?.input ?? null,
          output: model.cost?.output ?? null,
          cacheRead: model.cost?.cache_read ?? null,
        },
      } satisfies NormalizedModel
    })
  })
}

export const useModelsStore = defineStore('models', () => {
  const searchTerm = ref('')
  const selectedProviderId = ref<string>('all')

  const modelsQuery = useQuery<ProvidersResponse>({
    key: ['providers-all'],
    staleTime: 1000 * 60 * 5,
    query: async () => {
      const response = await fetch(MODELS_URL)
      if (!response.ok) throw new Error('无法加载模型数据')
      return response.json() as Promise<ProvidersResponse>
    },
  })

  const models = computed<NormalizedModel[]>(() => normalizeProviders(modelsQuery.data.value))

  const providers = computed(() => {
    const entries = modelsQuery.data.value?.providers ?? {}
    return Object.values(entries).map((provider) => ({
      id: provider.id,
      name: provider.display_name ?? provider.name ?? provider.id,
    }))
  })

  const filteredModels = computed(() => {
    const baseModels = models.value
    const providerFilter = selectedProviderId.value
    const search = searchTerm.value.trim().toLowerCase()
    const tokens = search ? search.split(/\s+/).filter(Boolean) : []

    return baseModels.filter((model) => {
      if (providerFilter !== 'all' && model.providerId !== providerFilter) return false
      if (!tokens.length) return true

      const haystack = [
        model.modelId,
        model.modelName,
        model.modelDisplayName,
        model.providerId,
        model.providerDisplayName,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase())

      return tokens.every((token) => haystack.some((value) => value.includes(token)))
    })
  })

  const setSearch = (value: string) => {
    searchTerm.value = value
  }

  const setProvider = (providerId: string) => {
    selectedProviderId.value = providerId
  }

  return {
    // state
    searchTerm,
    selectedProviderId,

    // data
    modelsQuery,
    models,
    filteredModels,
    providers,

    // actions
    setSearch,
    setProvider,
  }
})
