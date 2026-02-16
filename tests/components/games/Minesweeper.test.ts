import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Minesweeper from '~/components/games/Minesweeper.vue'

describe('Minesweeper.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(Minesweeper)
    expect(wrapper.find('.minesweeper').exists()).toBe(true)
    expect(wrapper.find('.minesweeper__header').exists()).toBe(true)
    expect(wrapper.find('.minesweeper__grid').exists()).toBe(true)
  })

  it('initializes the grid with default dimensions', () => {
    const wrapper = mount(Minesweeper)
    // Default 9x9 grid
    const cells = wrapper.findAll('.minesweeper__cell')
    expect(cells.length).toBe(81)
  })

  it('reveals a cell when clicked', async () => {
    const wrapper = mount(Minesweeper)
    const firstCell = wrapper.find('.minesweeper__cell')
    await firstCell.trigger('mousedown')
    await firstCell.trigger('mouseup')
    expect(firstCell.classes()).toContain('minesweeper__cell--revealed')
  })

  it('flags a cell when right-clicked', async () => {
    const wrapper = mount(Minesweeper)
    const firstCell = wrapper.find('.minesweeper__cell')
    await firstCell.trigger('contextmenu')
    expect(firstCell.classes()).toContain('minesweeper__cell--flagged')

    // Cycle to question mark
    await firstCell.trigger('contextmenu')
    expect(firstCell.classes()).toContain('minesweeper__cell--question')
    expect(firstCell.text()).toBe('?')

    // Cycle back to hidden
    await firstCell.trigger('contextmenu')
    expect(firstCell.classes()).toContain('minesweeper__cell--hidden')
  })

  it('resets the game when reset button is clicked', async () => {
    const wrapper = mount(Minesweeper)
    // Reveal a cell
    await wrapper.find('.minesweeper__cell').trigger('mouseup')
    expect(wrapper.findAll('.minesweeper__cell--revealed').length).toBeGreaterThan(0)
    
    // Reset
    await wrapper.find('.minesweeper__reset-button').trigger('click')
    expect(wrapper.findAll('.minesweeper__cell--revealed').length).toBe(0)
  })

  describe('Difficulty Levels', () => {
    it('changes grid size when changeDifficulty is called', async () => {
      const wrapper = mount(Minesweeper) as any
      await wrapper.vm.changeDifficulty('intermediate')

      const cells = wrapper.findAll('.minesweeper__cell')
      expect(cells.length).toBe(256) // 16x16

      await wrapper.vm.changeDifficulty('expert')
      const cellsExpert = wrapper.findAll('.minesweeper__cell')
      expect(cellsExpert.length).toBe(480) // 16x30
    })

    it('loads high scores from localStorage', () => {
      const mockScores = {
        beginner: { name: 'Test User', time: 10 }
      }
      localStorage.setItem('minesweeper-highscores', JSON.stringify(mockScores))

      const wrapper = mount(Minesweeper) as any
      expect(wrapper.vm.bestTimes.beginner.name).toBe('Test User')
      expect(wrapper.vm.bestTimes.beginner.time).toBe(10)

      localStorage.removeItem('minesweeper-highscores')
    })
  })
})
