# m00-os-7

A silly, nostalgic web-based operating system inspired by late 90s Apple Macintosh design. Built with Nuxt 4 and Vue 3, this project combines classic aesthetics with modern multi-user features, real-time chat, and a collection of retro-style games. It's less of a strict clone and more of a playful reimagining of the classic OS experience for the modern web.

![m00-os-7 Preview](docs/images/preview.png)

## ✨ Features

### Core Desktop Experience
- **Window Management** - Movable, resizable, and stackable application windows with classic title bars
- **Desktop Icons** - Rearrangeable icons with drag-and-drop functionality
- **Menu Bar** - Late 90s inspired Apple menu bar with dropdown menus and application context menu
- **Finder** - File and folder explorer for navigating the virtual filesystem
- **Trash** - Functional trash can for deleting files
- **Control Panels** - Playful system settings and preferences

### Multi-User & Social
- **User Accounts** - Full multi-user support with a nostalgic login screen
- **Guest Mode** - Jump in instantly with auto-generated unique friendly guest names
- **Share the Computer** - Toggle collaborative mode to share your desktop with other users in real-time
- **Real-time Chat** - Built-in Messenger for instant messaging with other online users
- **User Presence** - See who else is online and interacting with the shared environment

### Retro Games & Fun
- **Brickle** - Classic Breakout-style brick breaker game
- **Puzzle** - Challenging sliding tile puzzle game
- **Minesweeper** - The classic mine-clearing strategy game
- **Tetris** - Block-stacking puzzle action
- **Solitaire** - The timeless Klondike card game
- **Eliza** - Chat with the classic computer therapist

### Classic Utilities
- **Paint** - MacPaint-style drawing application with classic dither patterns
- **SimpleText** - View and edit text files and README articles
- **Note Pad** - Quick multi-page notes application
- **Scrapbook** - Retro image and text clipboard manager
- **Calculator** - Faithful recreation of the classic calculator
- **About This Macintosh** - System information with a nostalgic touch

### System & Customization
- **Boot Sequence** - Simulated startup with classic "Welcome to Macintosh" screen
- **Desktop Patterns** - Dozens of classic background textures and patterns
- **Appearance Settings** - Adjustable fonts, colors, and system-wide styles
- **Persistent Storage** - All your files and settings are saved to your user account
- **Sound Effects** - Optional classic system beeps and UI sounds

## 🛠 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (v4.3.1)
- **Frontend**: [Vue 3](https://vuejs.org/) (v3.5.28)
- **UI Components**: [@nuxt/ui](https://ui.nuxt.com/) (v4.4.0)
- **Content Management**: [@nuxt/content](https://content.nuxt.com/) (v3.11.2)
- **Image Optimization**: [@nuxt/image](https://image.nuxt.com/) (v2.0.0)
- **Accessibility**: [@nuxt/a11y](https://a11y.nuxt.com/) (v1.0.0-alpha.1)
- **Asset Generation**: Python PIL (Pillow) for icon generation
- **Real-time**: WebSocket for chat functionality
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js 18.x or higher
- npm, pnpm, yarn, or bun
- Python 3.8+ with Pillow (for asset generation)
- Docker (for containerized deployment)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/m00-os-7.git
   cd m00-os-7
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate assets (optional)**
   ```bash
   python scripts/generate_assets.py
   ```

### Development

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🐳 Docker Deployment

### Build the Docker Image

```bash
docker build -t m00-os-7 .
```

### Run the Container

```bash
docker run -d -p 3000:3000 --env-file .env --name m00-os-7 m00-os-7
```

### Docker Compose

```bash
docker-compose up -d
```

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Application
NUXT_PUBLIC_APP_NAME=m00-os-7
NUXT_PUBLIC_APP_VERSION=1.0.0

# Server
NUXT_HOST=0.0.0.0
NUXT_PORT=3000

# Database (for user/data persistence)
DATABASE_URL=sqlite://./data/m00os7.db

# WebSocket (for chat)
WEBSOCKET_PORT=3001
WEBSOCKET_SECRET=your-secret-key

# Authentication
AUTH_SECRET=your-auth-secret
GUEST_MODE_ENABLED=true

# Asset Generation
ASSET_OUTPUT_DIR=./public/assets/generated

# Feature Flags
ENABLE_CHAT=true
ENABLE_GAMES=true
ENABLE_BROWSER=false
```

## 📁 File Structure

```
m00-os-7/
├── app/
│   ├── assets/                    # Static assets (CSS, images)
│   │   ├── css/
│   │   │   ├── main.css           # Global styles
│   │   │   ├── system7.css        # Mac OS 7 specific styles
│   │   │   └── fonts.css          # Font definitions
│   │   └── images/
│   │       └── patterns/          # Desktop background patterns
│   │
│   ├── components/
│   │   ├── desktop/
│   │   │   ├── Desktop.vue        # Main desktop component
│   │   │   ├── DesktopIcon.vue    # Draggable desktop icon
│   │   │   ├── MenuBar.vue        # Top menu bar
│   │   │   ├── AppleMenu.vue      # Apple menu dropdown
│   │   │   └── Trash.vue          # Trash can component
│   │   │
│   │   ├── window/
│   │   │   ├── Window.vue         # Base window component
│   │   │   ├── WindowTitleBar.vue # Window title bar with controls
│   │   │   ├── WindowContent.vue  # Window content area
│   │   │   └── WindowResize.vue   # Resize handle component
│   │   │
│   │   ├── system/
│   │   │   ├── BootScreen.vue     # Boot sequence animation
│   │   │   ├── LoginScreen.vue    # User login interface
│   │   │   ├── AlertDialog.vue    # System alert dialogs
│   │   │   └── Clock.vue          # Menu bar clock
│   │   │
│   │   ├── apps/
│   │   │   ├── Finder.vue         # Finder application
│   │   │   ├── SimpleText.vue     # Text viewer/editor
│   │   │   ├── Calculator.vue     # Calculator app
│   │   │   ├── ControlPanels.vue  # System settings
│   │   │   ├── NotePad.vue        # Notes application
│   │   │   ├── Scrapbook.vue      # Clipboard manager
│   │   │   └── AboutMac.vue       # About dialog
│   │   │
│   │   ├── games/
│   │   │   ├── Solitaire.vue      # Solitaire card game
│   │   │   ├── Tetris.vue         # Tetris game
│   │   │   └── Galaga.vue         # Galaga arcade game
│   │   │
│   │   └── chat/
│   │       ├── ChatWindow.vue     # Main chat interface
│   │       ├── BuddyList.vue      # Contact list
│   │       └── ChatMessage.vue    # Individual message
│   │
│   ├── composables/
│   │   ├── useWindowManager.ts    # Window state management
│   │   ├── useDesktop.ts          # Desktop state and icons
│   │   ├── useFileSystem.ts       # Virtual filesystem
│   │   ├── useUser.ts             # User authentication
│   │   ├── useSettings.ts         # System settings
│   │   └── useSound.ts            # Sound effects
│   │
│   ├── layouts/
│   │   └── default.vue            # Default layout
│   │
│   ├── pages/
│   │   └── index.vue              # Main entry point
│   │
│   ├── plugins/
│   │   ├── websocket.client.ts    # WebSocket client plugin
│   │   └── persistence.ts         # Data persistence plugin
│   │
│   ├── stores/
│   │   ├── desktop.ts             # Desktop state (Pinia)
│   │   ├── windows.ts             # Window management state
│   │   ├── filesystem.ts          # Virtual filesystem state
│   │   ├── user.ts                # User state
│   │   └── settings.ts            # Settings state
│   │
│   └── app.vue                    # Root Vue component
│
├── content/
│   ├── articles/                  # Blog/readme articles (Markdown)
│   │   ├── welcome.md
│   │   └── about.md
│   └── help/                      # Help documentation
│       └── getting-started.md
│
├── public/
│   ├── assets/
│   │   ├── icons/                 # Application icons
│   │   ├── cursors/               # Custom cursors
│   │   └── sounds/                # System sounds
│   ├── favicon.ico
│   └── robots.txt
│
├── scripts/
│   ├── generate_assets.py         # PIL asset generation script
│   ├── generate_icons.py          # Icon generation
│   └── generate_patterns.py       # Background pattern generation
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts      # Login endpoint
│   │   │   ├── logout.post.ts     # Logout endpoint
│   │   │   └── register.post.ts   # Registration endpoint
│   │   ├── users/
│   │   │   └── [...].ts           # User CRUD operations
│   │   ├── files/
│   │   │   └── [...].ts           # File operations
│   │   └── settings/
│   │       └── [...].ts           # Settings endpoints
│   │
│   ├── middleware/
│   │   └── auth.ts                # Authentication middleware
│   │
│   ├── plugins/
│   │   └── websocket.ts           # WebSocket server plugin
│   │
│   └── utils/
│       ├── db.ts                  # Database utilities
│       └── auth.ts                # Auth utilities
│
├── data/                          # Persistent data storage
│   └── .gitkeep
│
├── docs/
│   ├── images/                    # Documentation images
│   └── api/                       # API documentation
│
├── tests/
│   ├── unit/                      # Unit tests
│   └── e2e/                       # End-to-end tests
│
├── .env.example                   # Environment variables template
├── .gitignore
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Docker build configuration
├── nuxt.config.ts                 # Nuxt configuration
├── package.json
├── README.md                      # This file
├── ROADMAP.md                     # Development roadmap
├── TASKLIST.md                    # Detailed task list
└── tsconfig.json                  # TypeScript configuration
```

## 🎨 Asset Generation

Icons and graphics are generated using Python PIL (Pillow) to closely mimic the classic Mac OS 7 style without directly copying original assets.

### Generate All Assets

```bash
cd scripts
python generate_assets.py
```

### Generate Specific Assets

```bash
# Generate icons only
python generate_icons.py

# Generate background patterns only
python generate_patterns.py
```

### Asset Style Guidelines

- **Color Palette**: Classic Mac 16-color palette
- **Icon Size**: 32x32 pixels (standard), 16x16 (small)
- **Style**: 1-bit dithering for classic look, optional 8-bit color
- **Borders**: 1px black outlines
- **Shadows**: Drop shadows for 3D effect

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## 📖 Documentation

- [Roadmap](ROADMAP.md) - Development phases and milestones
- [Task List](TASKLIST.md) - Detailed implementation tasks
- [API Documentation](docs/api/README.md) - Server API reference
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apple Computer, Inc. for the original Macintosh System 7
- The vintage computing community for preservation efforts
- [Nuxt](https://nuxt.com/) team for the amazing framework
- All contributors and supporters of this project

## ⚠️ Disclaimer

This project is a fan-made tribute and educational exercise. It is not affiliated with, endorsed by, or connected to Apple Inc. in any way. Mac OS, Macintosh, and related trademarks are the property of Apple Inc. No copyrighted assets from the original Mac OS are used in this project.

---

<p align="center">
  Made with ❤️ and nostalgia
</p>
