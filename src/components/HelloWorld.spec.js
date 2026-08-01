import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(HelloWorld)
    expect(wrapper.find('h1').text()).toBe('Get started')
    expect(wrapper.find('button.counter').text()).toBe('Count is 0')
  })

  it('increments count when button is clicked', async () => {
    const wrapper = mount(HelloWorld)
    const button = wrapper.find('button.counter')

    await button.trigger('click')
    expect(button.text()).toBe('Count is 1')

    await button.trigger('click')
    expect(button.text()).toBe('Count is 2')
  })
})
