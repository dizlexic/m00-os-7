import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Calculator from '~/components/apps/Calculator.vue'

describe('Calculator.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(Calculator)
    expect(wrapper.find('.calculator').exists()).toBe(true)
    expect(wrapper.find('.calculator__display').text()).toBe('0')
  })

  it('updates display when number buttons are clicked', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="1"]').trigger('click')
    await wrapper.find('[data-value="2"]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('12')
  })

  it('performs addition', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="5"]').trigger('click')
    await wrapper.find('[data-value="+"]').trigger('click')
    await wrapper.find('[data-value="3"]').trigger('click')
    await wrapper.find('[data-value="="]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('8')
  })

  it('performs subtraction', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="9"]').trigger('click')
    await wrapper.find('[data-value="-"]').trigger('click')
    await wrapper.find('[data-value="4"]').trigger('click')
    await wrapper.find('[data-value="="]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('5')
  })

  it('performs multiplication', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="6"]').trigger('click')
    await wrapper.find('[data-value="*"]').trigger('click')
    await wrapper.find('[data-value="7"]').trigger('click')
    await wrapper.find('[data-value="="]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('42')
  })

  it('performs division', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="8"]').trigger('click')
    await wrapper.find('[data-value="/"]').trigger('click')
    await wrapper.find('[data-value="2"]').trigger('click')
    await wrapper.find('[data-value="="]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('4')
  })

  it('clears display when C button is clicked', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="1"]').trigger('click')
    await wrapper.find('[data-value="C"]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('0')
  })

  it('handles decimal points', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="1"]').trigger('click')
    await wrapper.find('[data-value="."]').trigger('click')
    await wrapper.find('[data-value="5"]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('1.5')
  })

  it('performs square root', async () => {
    const wrapper = mount(Calculator)
    await wrapper.find('[data-value="9"]').trigger('click')
    // We'll need to add a button with data-value="sqrt"
    await wrapper.find('[data-value="sqrt"]').trigger('click')
    expect(wrapper.find('.calculator__display').text()).toBe('3')
  })
})
