import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { demoStatePlugin } from './server/demoStatePlugin'

export default defineConfig({
  plugins: [react(), demoStatePlugin()],
  test: { environment: 'node' },
})
