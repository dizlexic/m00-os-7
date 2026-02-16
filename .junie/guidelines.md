# m00-os-7 Project Guidelines

Comprehensive development guidelines for the Mac OS 7 web clone project. These guidelines ensure consistency, maintainability, and adherence to the project's visual and technical goals.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Code Style & Conventions](#code-style--conventions)
3. [Component Guidelines](#component-guidelines)
4. [File Structure Guidelines](#file-structure-guidelines)
5. [Git Workflow](#git-workflow)
6. [Testing Guidelines](#testing-guidelines)
7. [Test Driven Development](#test-driven-development)
8. [Documentation Standards](#documentation-standards)
9. [Mac OS 7 Design Principles](#mac-os-7-design-principles)
10. [Asset Generation Guidelines](#asset-generation-guidelines)
11. [Performance Guidelines](#performance-guidelines)
12. [Security Guidelines](#security-guidelines)
13. [Accessibility Guidelines](#accessibility-guidelines)

---

## Project Overview

### Mission Statement
Create a faithful, nostalgic recreation of Apple Macintosh System 7 as a single-page web application, maintaining visual authenticity while using modern web technologies.

### Tech Stack
- **Framework**: Nuxt 4 (v4.3.1)
- **Frontend**: Vue 3 (v3.5.28)
- **Language**: TypeScript (strict mode)
- **UI Components**: @nuxt/ui (v4.4.0)
- **Content**: @nuxt/content (v3.11.2)
- **Image Optimization**: @nuxt/image (v2.0.0)
- **Accessibility**: @nuxt/a11y (v1.0.0-alpha.1)
- **Asset Generation**: Python PIL (Pillow)
- **Real-time**: WebSocket
- **Containerization**: Docker

### Priority System
When working on tasks, follow this priority system:
- **P0 (Critical)**: Core functionality required for MVP - must be completed first
- **P1 (High)**: Important features for good user experience
- **P2 (Medium)**: Enhanced features and polish
- **P3 (Low)**: Nice-to-have features for future releases

---

## Code Style & Conventions

### TypeScript

#### General Rules
- Use TypeScript strict mode (`strict: true` in tsconfig.json)
- Always define explicit types for function parameters and return values
- Avoid `any` type - use `unknown` if type is truly unknown
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` over `let`, never use `var`

#### Naming Conventions
```typescript
// Interfaces - PascalCase with 'I' prefix optional
interface WindowState { ... }
interface IFileSystemNode { ... }

// Types - PascalCase
type FileType = 'folder' | 'document' | 'application';
type WindowPosition = { x: number; y: number };

// Enums - PascalCase with PascalCase members
enum WindowState {
  Normal = 'normal',
  Minimized = 'minimized',
  Maximized = 'maximized'
}

// Constants - SCREAMING_SNAKE_CASE
const MAX_WINDOW_COUNT = 20;
const DEFAULT_ICON_SIZE = 32;

// Functions - camelCase
function openWindow(id: string): void { ... }
function calculatePosition(x: number, y: number): WindowPosition { ... }

// Variables - camelCase
const windowManager = useWindowManager();
let currentZIndex = 100;
```

#### File Organization
```typescript
// 1. Imports (grouped and ordered)
// External packages
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

// Internal modules (using path aliases)
import { useWindowManager } from '~/composables/useWindowManager';
import type { WindowConfig } from '~/types/window';

// 2. Type definitions
interface Props { ... }

// 3. Constants
const DEFAULT_WIDTH = 400;

// 4. Main logic
// ...
```

### Vue Components

#### Single File Component Structure
```vue
<script setup lang="ts">
// 1. Imports
// 2. Props & Emits definitions
// 3. Composables
// 4. Reactive state
// 5. Computed properties
// 6. Watchers
// 7. Methods
// 8. Lifecycle hooks
</script>

<template>
  <!-- Template content -->
</template>

<style scoped>
/* Component styles */
</style>
```

#### Props Definition
```typescript
// Use defineProps with TypeScript interface
interface Props {
  title: string;
  width?: number;
  height?: number;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 300,
  isActive: false
});
```

#### Emits Definition
```typescript
// Define emits with TypeScript
const emit = defineEmits<{
  close: [];
  resize: [width: number, height: number];
  move: [x: number, y: number];
}>();
```

### CSS/Styling

#### CSS Variables
Use CSS variables for theming and consistency:
```css
:root {
  /* Mac OS 7 Color Palette */
  --color-white: #FFFFFF;
  --color-black: #000000;
  --color-gray-light: #CCCCCC;
  --color-gray-medium: #999999;
  --color-gray-dark: #666666;
  --color-highlight: #000080;
  --color-highlight-text: #FFFFFF;
  
  /* Spacing */
  --spacing-xs: 2px;
  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  
  /* Typography */
  --font-system: 'Chicago', 'Geneva', sans-serif;
  --font-size-sm: 9px;
  --font-size-md: 12px;
  --font-size-lg: 14px;
  
  /* Window */
  --window-border-width: 1px;
  --window-title-height: 20px;
  --window-shadow: 1px 1px 0 var(--color-black);
}
```

#### Class Naming (BEM-inspired)
```css
/* Block */
.window { }

/* Element */
.window__title-bar { }
.window__content { }
.window__resize-handle { }

/* Modifier */
.window--active { }
.window--minimized { }
.window__title-bar--dragging { }
```

#### Scoped Styles
- Always use `<style scoped>` for component-specific styles
- Use global styles only for base/reset styles and CSS variables
- Avoid deep selectors (`:deep()`) unless absolutely necessary

---

## Component Guidelines

### Naming Conventions

#### Component Files
- Use PascalCase for component file names
- Name should be descriptive and indicate purpose
- Group related components in subdirectories

```
components/
├── desktop/
│   ├── Desktop.vue           # Main desktop component
│   ├── DesktopIcon.vue       # Individual desktop icon
│   └── DesktopGrid.vue       # Icon grid layout
├── window/
│   ├── Window.vue            # Base window component
│   ├── WindowTitleBar.vue    # Window title bar
│   └── WindowContent.vue     # Window content area
└── system/
    ├── BootScreen.vue        # Boot sequence
    └── LoginScreen.vue       # User login
```

#### Component Categories
1. **Desktop Components** (`components/desktop/`)
    - Desktop environment elements
    - Icons, menu bar, trash

2. **Window Components** (`components/window/`)
    - Window management UI
    - Title bars, resize handles, scrollbars

3. **System Components** (`components/system/`)
    - Boot sequence, login, alerts
    - System-level UI elements

4. **Application Components** (`components/apps/`)
    - Individual application UIs
    - Finder, SimpleText, Calculator, etc.

5. **Game Components** (`components/games/`)
    - Game-specific components
    - Solitaire, Tetris, Galaga

6. **Chat Components** (`components/chat/`)
    - Real-time chat UI
    - Buddy list, message display

### Component Design Principles

#### Single Responsibility
Each component should do one thing well:
```vue
<!-- Good: Focused component -->
<WindowTitleBar 
  :title="windowTitle"
  :is-active="isActive"
  @close="handleClose"
  @minimize="handleMinimize"
/>

<!-- Avoid: Monolithic component doing too much -->
<Window>
  <!-- Contains title bar, content, resize, scrollbars, etc. all in one -->
</Window>
```

#### Props Down, Events Up
- Pass data to children via props
- Communicate to parents via events
- Avoid direct parent/child manipulation

#### Composables for Shared Logic
Extract reusable logic into composables:
```typescript
// composables/useWindowManager.ts
export function useWindowManager() {
  const windows = ref<Map<string, WindowState>>(new Map());
  
  function openWindow(config: WindowConfig): string { ... }
  function closeWindow(id: string): void { ... }
  function bringToFront(id: string): void { ... }
  
  return {
    windows: readonly(windows),
    openWindow,
    closeWindow,
    bringToFront
  };
}
```

#### Application Context Menu
All applications must include an application-specific dropdown menu in the Menu Bar, titled with the application's name. This is referred to as the **Application Context Menu**.
- **Location**: Positioned after the Apple menu and before standard menus like File and Edit.
- **Purpose**: Contains application-specific options and global application commands.
- **Standard Items**: Should include a "Quit" option at minimum.

---

## File Structure Guidelines

### Directory Structure
```
m00-os-7/
├── app/                          # Application source code
│   ├── assets/                   # Static assets (CSS, images)
│   │   ├── css/
│   │   │   ├── main.css          # Global styles
│   │   │   ├── system7.css       # Mac OS 7 specific styles
│   │   │   └── fonts.css         # Font definitions
│   │   └── images/
│   │       └── patterns/         # Desktop background patterns
│   │
│   ├── components/               # Vue components
│   │   ├── desktop/              # Desktop environment
│   │   ├── window/               # Window management
│   │   ├── system/               # System components
│   │   ├── apps/                 # Application components
│   │   ├── games/                # Game components
│   │   └── chat/                 # Chat components
│   │
│   ├── composables/              # Vue composables
│   │   ├── useWindowManager.ts
│   │   ├── useDesktop.ts
│   │   ├── useFileSystem.ts
│   │   ├── useUser.ts
│   │   ├── useSettings.ts
│   │   └── useSound.ts
│   │
│   ├── layouts/                  # Page layouts
│   │   └── default.vue
│   │
│   ├── pages/                    # Route pages
│   │   └── index.vue
│   │
│   ├── plugins/                  # Nuxt plugins
│   │   ├── websocket.client.ts
│   │   └── persistence.ts
│   │
│   ├── stores/                   # Pinia stores
│   │   ├── desktop.ts
│   │   ├── windows.ts
│   │   ├── filesystem.ts
│   │   ├── user.ts
│   │   └── settings.ts
│   │
│   └── app.vue                   # Root component
│
├── content/                      # Markdown content
│   ├── articles/                 # Blog/readme articles
│   └── help/                     # Help documentation
│
├── public/                       # Public static files
│   ├── assets/
│   │   ├── icons/                # Application icons
│   │   ├── cursors/              # Custom cursors
│   │   └── sounds/               # System sounds
│   ├── favicon.ico
│   └── robots.txt
│
├── scripts/                      # Build/generation scripts
│   ├── generate_assets.py        # Main asset generator
│   ├── generate_icons.py         # Icon generation
│   └── generate_patterns.py      # Pattern generation
│
├── server/                       # Server-side code
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── users/
│   │   ├── files/
│   │   └── settings/
│   ├── middleware/
│   ├── plugins/
│   └── utils/
│
├── tests/                        # Test files
│   ├── unit/
│   └── e2e/
│
├── docs/                         # Documentation
│   ├── images/
│   └── api/
│
├── data/                         # Persistent data storage
│
└── .junie/                       # Project guidelines
    └── guidelines.md             # This file
```

### Import Aliases
Use path aliases for clean imports:
```typescript
// nuxt.config.ts configures these aliases
import { useWindowManager } from '~/composables/useWindowManager';
import Window from '~/components/window/Window.vue';
import type { FileNode } from '~/types/filesystem';
```

### File Naming Rules
| Type | Convention | Example |
|------|------------|---------|
| Vue Components | PascalCase | `WindowTitleBar.vue` |
| Composables | camelCase with `use` prefix | `useWindowManager.ts` |
| Stores | camelCase | `windows.ts` |
| Types | camelCase | `filesystem.ts` |
| Utilities | camelCase | `dateUtils.ts` |
| Constants | camelCase or SCREAMING_SNAKE | `colors.ts` |
| API Routes | kebab-case | `get-user.ts` |
| CSS Files | kebab-case | `system7.css` |
| Python Scripts | snake_case | `generate_icons.py` |

---

## Git Workflow

### Branch Naming
```
main                    # Production-ready code
develop                 # Integration branch
feature/window-manager  # New features
bugfix/icon-alignment   # Bug fixes
hotfix/login-crash      # Urgent production fixes
release/v0.2.0          # Release preparation
```

### Commit Message Format
Follow Conventional Commits specification:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `ci`: CI/CD changes

#### Examples
```
feat(window): add drag-to-move functionality

Implement mouse drag handling for window title bar.
Windows can now be repositioned by dragging the title bar.

Closes #42
```

```
fix(desktop): correct icon grid alignment

Icons were not snapping to grid properly when
desktop was resized. Fixed calculation in
useDesktop composable.
```

```
docs(readme): update installation instructions
```

### Pull Request Guidelines
1. **Title**: Use conventional commit format
2. **Description**: Include:
    - What changes were made
    - Why the changes were needed
    - How to test the changes
    - Screenshots for UI changes
3. **Size**: Keep PRs focused and reasonably sized
4. **Reviews**: Require at least one approval before merge
5. **Tests**: All tests must pass
6. **Conflicts**: Resolve before requesting review

### Code Review Checklist
- [ ] Code follows project style guidelines
- [ ] TypeScript types are properly defined
- [ ] Components follow single responsibility principle
- [ ] No console.log or debugging code
- [ ] Tests are included for new functionality
- [ ] Documentation is updated if needed
- [ ] UI matches Mac OS 7 design principles
- [ ] No security vulnerabilities introduced

---

## Testing Guidelines

### Testing Stack
- **Unit Tests**: Vitest
- **Component Tests**: Vue Test Utils + Vitest
- **E2E Tests**: Playwright
- **Visual Regression**: Playwright screenshots

### Test File Organization
```
tests/
├── unit/
│   ├── composables/
│   │   ├── useWindowManager.test.ts
│   │   └── useFileSystem.test.ts
│   └── utils/
│       └── dateUtils.test.ts
├── components/
│   ├── window/
│   │   └── Window.test.ts
│   └── desktop/
│       └── DesktopIcon.test.ts
└── e2e/
    ├── boot.spec.ts
    ├── login.spec.ts
    └── window-management.spec.ts
```

### Test Naming Conventions
```typescript
// Unit tests
describe('useWindowManager', () => {
  describe('openWindow', () => {
    it('should create a new window with default position', () => { });
    it('should assign unique id to each window', () => { });
    it('should throw error when max windows exceeded', () => { });
  });
});

// Component tests
describe('Window.vue', () => {
  it('renders title correctly', () => { });
  it('emits close event when close button clicked', () => { });
  it('applies active class when isActive prop is true', () => { });
});
```

### Testing Best Practices
1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Keep tests independent and isolated**

### Coverage Requirements
- Aim for 80%+ coverage on composables and utilities
- All critical paths must be tested
- UI components should have basic render and interaction tests

---

## Test Driven Development

Test Driven Development (TDD) is a core practice for this project. All new features and bug fixes should follow the TDD methodology to ensure code quality, maintainability, and comprehensive test coverage.

### The Red-Green-Refactor Cycle

TDD follows a simple but powerful cycle:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌─────────┐      ┌─────────┐      ┌──────────┐          │
│    │   RED   │ ───► │  GREEN  │ ───► │ REFACTOR │ ───┐     │
│    └─────────┘      └─────────┘      └──────────┘    │     │
│         ▲                                            │     │
│         └────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

1. **RED**: Write a failing test that defines the expected behavior
2. **GREEN**: Write the minimum code necessary to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

### TDD Workflow

#### Step 1: Understand the Requirement
Before writing any code, clearly understand what needs to be built:
- Review the feature specification or bug report
- Identify acceptance criteria
- Break down complex features into smaller, testable units

#### Step 2: Write the Test First
```typescript
// Example: Testing a new window minimize feature
describe('useWindowManager', () => {
  describe('minimizeWindow', () => {
    it('should set window state to minimized', () => {
      // Arrange
      const { openWindow, minimizeWindow, windows } = useWindowManager();
      const windowId = openWindow({ title: 'Test Window' });
      
      // Act
      minimizeWindow(windowId);
      
      // Assert
      expect(windows.value.get(windowId)?.state).toBe('minimized');
    });

    it('should throw error when window does not exist', () => {
      // Arrange
      const { minimizeWindow } = useWindowManager();
      
      // Act & Assert
      expect(() => minimizeWindow('non-existent-id')).toThrow('Window not found');
    });
  });
});
```

#### Step 3: Run the Test (Expect Failure)
```bash
npm run test
```
Verify the test fails for the right reason - this confirms the test is valid.
Note: Avoid using `npx vitest` or `npm run test:watch` as they may hang in some environments. Use `npx vitest run` or `npm run test` instead.

#### Step 4: Write Minimal Implementation
```typescript
// composables/useWindowManager.ts
function minimizeWindow(id: string): void {
  const window = windows.value.get(id);
  if (!window) {
    throw new Error('Window not found');
  }
  window.state = 'minimized';
}
```

#### Step 5: Run the Test (Expect Success)
Verify all tests pass. If they don't, fix the implementation (not the test).

#### Step 6: Refactor
Improve code quality while keeping tests green:
- Extract common patterns
- Improve naming
- Optimize performance
- Remove duplication

### TDD for Different Scenarios

#### New Features
1. Write tests for the happy path first
2. Add tests for edge cases
3. Add tests for error conditions
4. Implement incrementally, one test at a time

```typescript
// Feature: Desktop icon selection
describe('DesktopIcon selection', () => {
  // Happy path
  it('should select icon on single click', () => { });
  it('should open item on double click', () => { });
  
  // Edge cases
  it('should deselect other icons when selecting new one', () => { });
  it('should allow multi-select with Cmd key held', () => { });
  
  // Error conditions
  it('should handle click on non-existent icon gracefully', () => { });
});
```

#### Bug Fixes
1. Write a test that reproduces the bug (should fail)
2. Fix the bug
3. Verify the test passes
4. Ensure no regression in existing tests

```typescript
// Bug: Window position resets after minimize/restore
describe('Window restore bug fix', () => {
  it('should preserve window position after minimize and restore', () => {
    // Arrange
    const { openWindow, minimizeWindow, restoreWindow, windows } = useWindowManager();
    const windowId = openWindow({ title: 'Test', x: 100, y: 200 });
    
    // Act
    minimizeWindow(windowId);
    restoreWindow(windowId);
    
    // Assert - this test should fail before the fix
    const window = windows.value.get(windowId);
    expect(window?.x).toBe(100);
    expect(window?.y).toBe(200);
  });
});
```

#### Refactoring Existing Code
1. Ensure comprehensive tests exist for current behavior
2. Add missing tests if needed
3. Refactor in small steps
4. Run tests after each change

### TDD Best Practices

#### Write Small, Focused Tests
```typescript
// Good: One assertion per test
it('should increment z-index when bringing window to front', () => {
  const { openWindow, bringToFront, windows } = useWindowManager();
  const windowId = openWindow({ title: 'Test' });
  const initialZIndex = windows.value.get(windowId)?.zIndex;
  
  bringToFront(windowId);
  
  expect(windows.value.get(windowId)?.zIndex).toBeGreaterThan(initialZIndex!);
});

// Avoid: Multiple unrelated assertions
it('should handle window operations', () => {
  // Too many things being tested at once
});
```

#### Use Descriptive Test Names
```typescript
// Good: Describes behavior and context
it('should emit close event when close button is clicked while window is active', () => { });

// Avoid: Vague or implementation-focused
it('tests close button', () => { });
```

#### Test Behavior, Not Implementation
```typescript
// Good: Tests observable behavior
it('should display error message when login fails', () => {
  // Test what the user sees
});

// Avoid: Tests internal implementation details
it('should call setError with "Invalid credentials"', () => {
  // Brittle - breaks if implementation changes
});
```

#### Keep Tests Independent
```typescript
// Good: Each test sets up its own state
describe('FileSystem', () => {
  let fileSystem: ReturnType<typeof useFileSystem>;
  
  beforeEach(() => {
    fileSystem = useFileSystem();
  });
  
  it('should create file', () => { });
  it('should delete file', () => { });
});

// Avoid: Tests that depend on order or shared state
```

### TDD with Vue Components

#### Component Testing Workflow
```typescript
// 1. Write test for component behavior
describe('WindowTitleBar.vue', () => {
  it('should display the window title', () => {
    const wrapper = mount(WindowTitleBar, {
      props: { title: 'My Window' }
    });
    
    expect(wrapper.text()).toContain('My Window');
  });
  
  it('should emit close event when close button is clicked', async () => {
    const wrapper = mount(WindowTitleBar, {
      props: { title: 'Test' }
    });
    
    await wrapper.find('[data-testid="close-button"]').trigger('click');
    
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});

// 2. Create the component to satisfy tests
// 3. Refactor component while keeping tests green
```

#### Testing Composables
```typescript
// Use @vue/test-utils for composable testing
import { renderComposable } from '@vue/test-utils';

describe('useSettings', () => {
  it('should return default theme when no preference set', () => {
    const { theme } = useSettings();
    expect(theme.value).toBe('classic');
  });
  
  it('should persist theme changes to localStorage', () => {
    const { theme, setTheme } = useSettings();
    
    setTheme('high-contrast');
    
    expect(localStorage.getItem('theme')).toBe('high-contrast');
  });
});
```

### When to Apply TDD

| Scenario | Apply TDD? | Notes |
|----------|------------|-------|
| New feature development | ✅ Yes | Always start with tests |
| Bug fixes | ✅ Yes | Write failing test first |
| Refactoring | ✅ Yes | Ensure tests exist before refactoring |
| Spike/Prototype | ⚠️ Optional | Discard code after learning |
| UI styling only | ⚠️ Optional | Visual regression tests may suffice |
| Configuration changes | ❌ Usually not | Unless behavior changes |

### TDD Checklist

Before submitting code, verify:
- [ ] Tests were written before implementation
- [ ] All tests pass
- [ ] Tests cover happy path, edge cases, and error conditions
- [ ] Tests are independent and can run in any order
- [ ] Test names clearly describe the expected behavior
- [ ] No implementation details are tested (only behavior)
- [ ] Code has been refactored while keeping tests green
- [ ] Coverage meets project requirements (80%+)

---

## Documentation Standards

### Code Documentation

#### JSDoc Comments
Use JSDoc for functions and complex types:
```typescript
/**
 * Opens a new window with the specified configuration.
 * 
 * @param config - Window configuration options
 * @param config.title - Window title displayed in title bar
 * @param config.width - Initial window width in pixels
 * @param config.height - Initial window height in pixels
 * @returns The unique identifier for the created window
 * @throws {Error} When maximum window count is exceeded
 * 
 * @example
 * const windowId = openWindow({
 *   title: 'Finder',
 *   width: 500,
 *   height: 400
 * });
 */
function openWindow(config: WindowConfig): string {
  // ...
}
```

#### Component Documentation
Document component props and events:
```vue
<script setup lang="ts">
/**
 * Window component that provides a draggable, resizable container
 * styled after Mac OS 7 windows.
 * 
 * @example
 * <Window
 *   title="My Document"
 *   :width="400"
 *   :height="300"
 *   @close="handleClose"
 * >
 *   <p>Window content here</p>
 * </Window>
 */

interface Props {
  /** Window title displayed in the title bar */
  title: string;
  /** Initial width in pixels */
  width?: number;
  /** Initial height in pixels */
  height?: number;
  /** Whether the window is currently active/focused */
  isActive?: boolean;
}
</script>
```

### README Files
Each major directory should have a README explaining:
- Purpose of the directory
- File organization
- Usage examples
- Related documentation

### Markdown Standards
- Use ATX-style headers (`#`, `##`, `###`)
- Include table of contents for long documents
- Use code blocks with language specification
- Include examples where helpful

---

## Mac OS 7 Design Principles

### Visual Authenticity
The goal is to recreate the Mac OS 7 experience as faithfully as possible while using modern web technologies.

### Color Palette
Use the classic Mac 16-color palette:
```
Black:        #000000
White:        #FFFFFF
Gray (Light): #CCCCCC
Gray (Medium):#999999
Gray (Dark):  #666666
Blue:         #000080
Cyan:         #00FFFF
Green:        #00FF00
Magenta:      #FF00FF
Red:          #FF0000
Yellow:       #FFFF00
```

### Typography
- **System Font**: Chicago (or similar bitmap-style font)
- **Sizes**: 9px (small), 12px (standard), 14px (large)
- **Anti-aliasing**: Avoid - use crisp, pixel-perfect rendering

### Window Design
```
┌─────────────────────────────────────┐
│ ▢ ═══════ Window Title ═══════════ │  ← Title bar with stripes
├─────────────────────────────────────┤
│                                     │
│         Window Content              │
│                                     │
│                                     │
│                                   ▄▄│  ← Resize handle
└─────────────────────────────────────┘
```

#### Window Elements
- **Title Bar**: 20px height, horizontal stripes when active
- **Close Button**: Small square on left side
- **Zoom Button**: Toggle between sizes
- **Collapse Button**: Minimize to title bar only
- **Resize Handle**: Bottom-right corner, diagonal lines

### Icon Design
- **Standard Size**: 32x32 pixels
- **Small Size**: 16x16 pixels
- **Style**: 1-bit or 8-bit color depth
- **Borders**: 1px black outline
- **Shadows**: Drop shadow for 3D effect
- **Dithering**: Use for gradients in 1-bit mode

### UI Elements

#### Buttons
```
┌─────────────┐
│    OK      │  ← Default button (bold border)
└─────────────┘

┌─────────────┐
│   Cancel   │  ← Standard button
└─────────────┘
```

#### Checkboxes and Radio Buttons
```
☑ Checked checkbox
☐ Unchecked checkbox
◉ Selected radio
○ Unselected radio
```

#### Scrollbars
- Arrows at top and bottom
- Draggable thumb
- Track for page scrolling
- Classic gray appearance

### Interaction Patterns
1. **Single Click**: Select item
2. **Double Click**: Open/activate item
3. **Click and Drag**: Move or select multiple
4. **Right Click**: Context menu (optional, not in original)
5. **Keyboard Shortcuts**: Cmd+key combinations
6. **Application Context Menu**: Click on the application name in the menu bar to access application-specific options.

### Sound Design
- **Startup Chime**: Classic Mac boot sound
- **System Beep**: Alert sound
- **Trash Empty**: Crumpling paper sound
- **Window Actions**: Subtle click sounds

---

## Asset Generation Guidelines

### Python PIL Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install Pillow
```

### Icon Generation Standards
```python
from PIL import Image, ImageDraw

# Standard icon sizes
ICON_SIZE_STANDARD = (32, 32)
ICON_SIZE_SMALL = (16, 16)

# Color palette
COLORS = {
    'black': (0, 0, 0),
    'white': (255, 255, 255),
    'gray_light': (204, 204, 204),
    'gray_medium': (153, 153, 153),
    'gray_dark': (102, 102, 102),
}

def create_icon(name: str, size: tuple = ICON_SIZE_STANDARD) -> Image:
    """Create a new icon with transparent background."""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    return img, draw

def add_shadow(img: Image, offset: tuple = (1, 1)) -> Image:
    """Add drop shadow to icon."""
    # Implementation
    pass
```

### Asset Output Structure
```
public/assets/
├── icons/
│   ├── system/
│   │   ├── folder.png
│   │   ├── folder-open.png
│   │   ├── document.png
│   │   ├── trash-empty.png
│   │   └── trash-full.png
│   ├── apps/
│   │   ├── finder.png
│   │   ├── calculator.png
│   │   └── simpletext.png
│   └── ui/
│       ├── close-button.png
│       ├── zoom-button.png
│       └── scrollbar-thumb.png
├── cursors/
│   ├── arrow.png
│   ├── hand.png
│   ├── text.png
│   └── wait.png
├── patterns/
│   ├── default.png
│   ├── stripes.png
│   └── dots.png
└── sounds/
    ├── startup.mp3
    ├── beep.mp3
    └── trash.mp3
```

---

## Performance Guidelines

### Frontend Performance
1. **Lazy Loading**: Load applications on demand
2. **Code Splitting**: Separate chunks for each application
3. **Virtual Scrolling**: For large file lists in Finder
4. **Debouncing**: For resize and drag operations
5. **Memoization**: Cache computed values

### Asset Optimization
1. **Image Compression**: Optimize PNG files
2. **Sprite Sheets**: Combine small icons
3. **WebP Format**: Use for larger images
4. **Lazy Loading**: Load images as needed

### State Management
1. **Minimal Reactivity**: Only make necessary data reactive
2. **Shallow Refs**: Use `shallowRef` for large objects
3. **Computed Caching**: Leverage Vue's computed caching

---

## Security Guidelines

### Authentication
1. **Password Hashing**: Use bcrypt or Argon2
2. **Session Management**: Secure, HTTP-only cookies
3. **CSRF Protection**: Include CSRF tokens
4. **Rate Limiting**: Limit login attempts

### Data Validation
1. **Input Sanitization**: Sanitize all user input
2. **Type Validation**: Validate data types on server
3. **SQL Injection**: Use parameterized queries
4. **XSS Prevention**: Escape output, use CSP

### Environment Security
1. **Secrets Management**: Never commit secrets
2. **Environment Variables**: Use .env files
3. **HTTPS**: Enforce in production
4. **Headers**: Set security headers

---

## Accessibility Guidelines

### Keyboard Navigation
1. **Focus Management**: Logical focus order
2. **Keyboard Shortcuts**: Document and implement
3. **Tab Navigation**: All interactive elements focusable
4. **Escape Key**: Close dialogs and menus

### Screen Reader Support
1. **ARIA Labels**: Label all interactive elements
2. **Semantic HTML**: Use appropriate elements
3. **Live Regions**: Announce dynamic changes
4. **Alt Text**: Describe images and icons

### Visual Accessibility
1. **Color Contrast**: Meet WCAG AA standards
2. **Font Scaling**: Support user font preferences
3. **Reduced Motion**: Respect prefers-reduced-motion
4. **High Contrast**: Provide high contrast mode

---

## Quick Reference

### Common Commands
```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Testing
npm run test          # Run unit tests (single run)
npm run test:watch    # Alias for npm run test (non-watch)
npm run test:e2e      # Run E2E tests
npm run test:coverage # Run with coverage

# Asset Generation
python scripts/generate_assets.py    # Generate all assets
python scripts/generate_icons.py     # Generate icons only
python scripts/generate_patterns.py  # Generate patterns only

# Docker
docker build -t m00-os-7 .           # Build image
docker-compose up -d                  # Start containers
```

### Key Files
| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Nuxt configuration |
| `app/app.vue` | Root Vue component |
| `app/pages/index.vue` | Main entry page |
| `.env` | Environment variables |
| `docker-compose.yml` | Docker configuration |

### Related Documentation
- [README.md](../README.md) - Project overview
- [TASKLIST.md](../TASKLIST.md) - Detailed task breakdown
- [ROADMAP.md](../ROADMAP.md) - Development roadmap

---

*Last updated: February 2026*
