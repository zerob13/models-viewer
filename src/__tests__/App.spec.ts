import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import App from '../App.vue'

const mockPayload = {
  providers: {
    demo: {
      id: 'demo',
      name: 'Demo Provider',
      models: [
        {
          id: 'demo-model',
          name: 'Demo Model',
          display_name: 'Demo Model',
          modalities: { input: ['text'], output: ['text'] },
          limit: { context: 16000, output: 4000 },
          cost: { input: 0.1, output: 0.2 },
        },
      ],
    },
  },
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => mockPayload,
      })) as unknown as typeof fetch,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts and shows the catalog chrome', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), PiniaColada],
      },
    })

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Models Viewer')
    expect(wrapper.text()).toContain('1 / 1 models matched')
  })
})
