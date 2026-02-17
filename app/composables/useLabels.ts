import { computed } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'
import { useDesktop } from '~/composables/useDesktop'
import { useSettings } from '~/composables/useSettings'
import type { MenuItem } from '~/types/menu'

export function useLabels() {
  const { getNode, updateNode, getNodeByPath } = useFileSystem()
  const { activeWindow } = useWindowManager()
  const { icons: desktopIcons, updateIcon } = useDesktop()
  const { settings } = useSettings()

  const labelNames = computed(() => settings.value?.labelNames || [])
  const labelColors = computed(() => settings.value?.labelColors || [])

  function getLabelMenuItems(targetNodeId?: string, targetIconId?: string): MenuItem[] {
    let currentLabel = 0

    if (targetNodeId) {
      currentLabel = getNode(targetNodeId)?.label || 0
    } else if (targetIconId) {
      currentLabel = desktopIcons.value.find(i => i.id === targetIconId)?.label || 0
    } else if (activeWindow.value && activeWindow.value.type === 'finder') {
      const selectedId = (activeWindow.value.data as any)?.selectedItemId
      if (selectedId) {
        currentLabel = getNode(selectedId)?.label || 0
      }
    } else if (!activeWindow.value) {
      const selected = desktopIcons.value.find(icon => icon.isSelected)
      if (selected) {
        currentLabel = selected.label || 0
      }
    }

    return labelNames.value.map((name, index) => ({
      id: `label-${index}`,
      label: name,
      color: labelColors.value[index],
      checked: currentLabel === index,
      action: () => setLabel(index, targetNodeId, targetIconId)
    }))
  }

  function setLabel(label: number, targetNodeId?: string, targetIconId?: string) {
    if (targetNodeId) {
      updateNode(targetNodeId, { label })
    } else if (targetIconId) {
      const icon = desktopIcons.value.find(i => i.id === targetIconId)
      if (icon) {
        updateIcon(icon.id, { label })
        if (icon.path) {
          const node = getNodeByPath(icon.path)
          if (node) updateNode(node.id, { label })
        }
      }
    } else if (activeWindow.value && activeWindow.value.type === 'finder') {
      const selectedId = (activeWindow.value.data as any)?.selectedItemId
      if (selectedId) {
        updateNode(selectedId, { label })
      }
    } else if (!activeWindow.value) {
      const selectedIcons = desktopIcons.value.filter(icon => icon.isSelected)
      selectedIcons.forEach(icon => {
        updateIcon(icon.id, { label })
        if (icon.path) {
          const node = getNodeByPath(icon.path)
          if (node) updateNode(node.id, { label })
        }
      })
    }
  }

  return {
    getLabelMenuItems,
    setLabel,
    labelNames,
    labelColors
  }
}
