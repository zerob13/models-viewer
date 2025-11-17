/// <reference types="vite/client" />

declare module 'vite-plugin-vue-devtools' {
  import type { Plugin } from 'vite'
  export default function vueDevTools(): Plugin
}
