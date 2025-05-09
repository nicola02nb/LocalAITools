import { mount } from 'svelte'
import Sidepanel from './Sidepanel.svelte'

const app = mount(Sidepanel, {
  target: document.getElementById('app')!,
})

export default app
