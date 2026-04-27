# Tiki Topple - Complete Technology Stack Overview

## 📋 Table of Contents
1. [Frontend Technologies](#frontend-technologies)
2. [Backend Technologies](#backend-technologies)
3. [Development Tools](#development-tools)
4. [Technology Usage Map](#technology-usage-map)

---

## Frontend Technologies

### 🎨 **React 18.3.1**
**Purpose**: Core UI framework for building component-based user interface

**Used In:**
- **All Components** (`/src/components/`)
  - `StartScreen.jsx` - Entry screen with tiki guardians
  - `HomeScreen.jsx` - Main menu with avatar selection
  - `LobbyScreen.jsx` - Multiplayer waiting room with 3D island
  - `GameScreen.jsx` - Main game interface
  - `LoadingScreen.jsx` - Loading transitions
  - `AvatarCarousel.jsx` - 3D rotating avatar selector
  - `AvatarPicker.jsx` - Avatar selection UI
  - `PlayerHand.jsx` - Player's card hand display
  - `OpponentArea.jsx` - Opponent player cards
  - `TurnIndicator.jsx` - Current turn display
  - `RulesModal.jsx` - Game rules popup
  - `GameOverScreen.jsx` - End game screen
  - `RoundEndScreen.jsx` - Round completion screen
  - `SecretTikiCard.jsx` - Secret card display
  - `Notifications.jsx` - Toast notifications
  - `JungleAtmosphere.jsx` - Background atmosphere effects
  - `DottedSurface.jsx` - Animated particle background
  - `WindWhispers.jsx` - Ambient wind animation wrapper
  - `ErrorBoundary.jsx` - Error handling wrapper

**Key Features Used:**
- Hooks (useState, useEffect, useRef, useMemo, useCallback)
- Component composition
- Props and state management
- Lifecycle management

---

### 🎬 **Framer Motion 11.0.0**
**Purpose**: Advanced animation library for smooth, physics-based animations

**Used In:**

#### **StartScreen.jsx**
- Tiki guardian gate opening animations
- Title float and glow effects
- Button hover/tap animations
- Fog drift animations
- Particle floating effects

#### **HomeScreen.jsx**
- Wooden sign swing animations
- Cloud drift animations
- Sun rotation and bob
- Wave animations
- Tiki mascot blinking
- Avatar card hover effects
- Form slide-in animations

#### **LobbyScreen.jsx**
- Player card entrance animations
- Room code pulse effect
- Toast notification slide
- Button hover states
- Connection status pulse

#### **GameScreen.jsx**
- Card selection animations
- Turn indicator pulse
- Error toast slide-in
- Settings panel modal
- Opponent card fan animations
- Score pill animations

#### **AvatarCarousel.jsx**
- 3D carousel rotation
- Avatar card scaling
- Selection glow pulse
- Drag interactions

#### **PlayerHand.jsx**
- Card hover lift effects
- Card selection animations
- Hand fan spread

**Animation Types Used:**
- `motion.div` - Animated containers
- `motion.button` - Interactive buttons
- `AnimatePresence` - Enter/exit animations
- `useAnimation()` - Programmatic animation control
- Spring physics
- Cubic bezier easing
- Stagger animations

---

### 🎮 **Three.js 0.162.0**
**Purpose**: 3D graphics rendering for immersive game elements

**Used In:**

#### **TikiBoard.jsx** (Main 3D Game Board)
- **3D Tiki Pieces**: Cylinder bodies, box faces, sphere eyes, torus crowns
- **Board Structure**: Wooden plank with metallic gold material
- **Number Sprites**: Canvas-generated score markers
- **Player Pawns**: Glossy spheres tracking player scores
- **Animations**:
  - Tiki movement with arc trajectories
  - Topple animations with rotation
  - Toast explosion with particle system (20 particles)
  - Pawn movement along score track
- **Lighting**: 3-point cinematic setup (key, fill, rim lights)
- **Materials**: PBR (Physically Based Rendering) with metalness/roughness
- **Camera**: Angled perspective (8, 22, 28) with 40° FOV
- **Renderer**: ACESFilmicToneMapping, soft shadows

#### **LobbyScreen.jsx** (3D Island Scene)
- **Island Geometry**: Low-poly cylinder with randomized vertices
- **Campfire**: Animated flame cones with glow
- **Lantern Poles**: Wooden poles with glowing glass panels
- **Player Characters**: 3D low-poly figures with:
  - Body, legs, feet, arms, hands, head
  - Avatar-specific accessories (caps, feathers, hats)
  - Drop-in animations with physics
  - Idle breathing and swaying
- **Environment**:
  - Trees with cone foliage
  - Mountains in background
  - Starfield (1200 particles)
  - Moon with halo
  - Water plane with reflections
- **Lighting**: Moonlight, campfire point lights, lantern lights
- **Animations**: Character drop-in, idle sway, fire flicker

#### **DottedSurface.jsx** (Particle Wave Background)
- **Particle System**: 2400 points (40×60 grid)
- **Wave Animation**: Sine wave patterns
- **Materials**: PointsMaterial with vertex colors
- **Camera**: Elevated perspective view

**Three.js Features Used:**
- Geometries: BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, ConeGeometry, PlaneGeometry
- Materials: MeshStandardMaterial, MeshLambertMaterial, MeshBasicMaterial, MeshPhongMaterial, PointsMaterial
- Lights: AmbientLight, DirectionalLight, PointLight
- Shadows: PCFSoftShadowMap
- Fog: FogExp2
- Canvas textures for sprites
- Animation loops with requestAnimationFrame

---

### 🎯 **Zustand 4.5.0**
**Purpose**: Lightweight state management for global game state

**Used In:**

#### **gameStore.js** (`/src/store/`)
**State Managed:**
- Game phase (start, lobby, loading, playing, roundEnd, gameOver)
- Player data (myPlayerId, players array)
- Room data (myRoomCode, isHost)
- Game state (board, hands, scores, currentTurn)
- Round tracking (roundNumber, totalRounds)
- UI state (selectedCard, errorMessage, connectionStatus)
- Settings (masterVolume, musicEnabled, effectsEnabled, particlesEnabled)

**Actions:**
- `setGamePhase()` - Update game phase
- `setMyPlayerId()` - Set current player
- `setPlayers()` - Update player list
- `updateBoard()` - Update tiki board state
- `selectCard()` - Handle card selection
- `clearSelection()` - Clear selected card
- `setError()` - Display error messages
- `updateSettings()` - Modify game settings

**Consumed By:**
- All game screens (StartScreen, HomeScreen, LobbyScreen, GameScreen)
- All game components (PlayerHand, OpponentArea, TikiBoard)

---

### 🔌 **Socket.IO Client 4.7.2**
**Purpose**: Real-time bidirectional communication with game server

**Used In:**

#### **SocketContext.jsx** (`/src/context/`)
**Events Emitted (Client → Server):**
- `create_room` - Create new game room
- `join_room` - Join existing room
- `start_game` - Host starts game
- `play_card` - Player plays a card
- `disconnect` - Player leaves

**Events Received (Server → Client):**
- `room_created` - Room successfully created
- `room_joined` - Successfully joined room
- `lobby_update` - Player list updated
- `game_started` - Game begins
- `game_state` - Full game state sync
- `round_end` - Round completed
- `game_over` - Game finished
- `error` - Error messages
- `player_left` - Player disconnected

**Connection Management:**
- Auto-reconnection (5 attempts)
- Connection status tracking
- Error handling
- Cleanup on unmount

**Consumed By:**
- `HomeScreen.jsx` - Room creation/joining
- `LobbyScreen.jsx` - Lobby updates, game start
- `GameScreen.jsx` - Card plays, game state updates

---

### 🎨 **Tailwind CSS 3.4.1**
**Purpose**: Utility-first CSS framework (configured but minimally used)

**Configuration:**
- Custom color palette (wood, tiki, gold, torch)
- Custom fonts (Cinzel Decorative, Crimson Text)
- Custom shadows (torch-glow, gold-glow, card-lift)
- Wood grain background patterns

**Used In:**
- Minimal usage - project primarily uses inline styles
- `DottedSurface.jsx` - className prop support
- Configured for future expansion

**Note**: Most styling is done via inline React styles for dynamic theming and animation control.

---

### 🎨 **Custom CSS Animations**
**Purpose**: Keyframe animations for specific effects

**Used In:**

#### **StartScreen.jsx**
```css
@keyframes shake - Screen shake effect
@keyframes float - Title floating animation
@keyframes fogDrift - Fog layer movement
@keyframes breathe - Tiki guardian breathing
@keyframes pulse - Pulsing effects
@keyframes shimmer - Shine effects
@keyframes glow - Glow pulse
```

#### **HomeScreen.jsx**
```css
@keyframes float - Island floating
@keyframes fogDrift - Atmospheric fog
```

---

### 🎨 **HTML5 Canvas**
**Purpose**: High-performance 2D rendering for particle effects

**Used In:**

#### **WindWhispers Animation System** (`/src/animations/`)
- **wind-whispers.js** - Main canvas controller
  - Idle leaf drift rendering
  - Gust particle system
  - Wind streak effects
  - Vignette pulse
- **leaf-particle.js** - Individual particle physics
- **leaf-shapes.js** - SVG path definitions
- **gust-scheduler.js** - Randomized timing

**Canvas Features:**
- 60fps animation loop with requestAnimationFrame
- Particle pooling and recycling
- Path2D for SVG rendering
- Gradient fills
- Transform matrices
- Global alpha compositing

---

### 🎵 **Custom Sound Engine**
**Purpose**: Audio management system (hook structure in place)

**File**: `useSoundEngine.js` (`/src/hooks/`)

**Planned Features:**
- Sound effect playback
- Volume control
- Audio context management
- Sound pooling

**Integration Points:**
- GameScreen - Card play sounds
- TikiBoard - Movement sounds
- WindWhispers - Rustling audio (optional)

---

## Backend Technologies

### 🚀 **Node.js + Express 4.18.2**
**Purpose**: HTTP server and API endpoints

**Used In:**
- `server.js` - Main server file
- Static file serving for production build
- CORS configuration
- Port management

---

### 🔌 **Socket.IO 4.7.2**
**Purpose**: Real-time game server and room management

**Used In:**
- `server.js` - WebSocket server
- Room creation and management
- Player connection handling
- Game state broadcasting

**Features:**
- Room-based communication
- Player authentication
- State synchronization
- Disconnect handling

---

### 🎮 **Game Engine**
**Purpose**: Core game logic and rules

**File**: `gameEngine.js`

**Responsibilities:**
- Card validation
- Tiki movement logic
- Score calculation
- Round management
- Win condition checking

---

### 🔐 **UUID 9.0.0**
**Purpose**: Unique identifier generation

**Used For:**
- Player IDs
- Room codes (4-character format)
- Session management

---

### 🌐 **CORS 2.8.5**
**Purpose**: Cross-Origin Resource Sharing

**Configuration:**
- Allow frontend origin
- Enable credentials
- WebSocket support

---

### ⚙️ **Dotenv 16.4.5**
**Purpose**: Environment variable management

**Variables:**
- `PORT` - Server port
- `NODE_ENV` - Environment mode
- Other configuration

---

## Development Tools

### ⚡ **Vite 5.1.4**
**Purpose**: Fast build tool and dev server

**Features:**
- Hot Module Replacement (HMR)
- Fast cold start
- Optimized production builds
- ES modules support

**Configuration:**
- React plugin
- PostCSS integration
- Build optimization

---

### 🔄 **Nodemon 3.0.2**
**Purpose**: Auto-restart server on file changes

**Used In:**
- Backend development
- `npm run dev` script

---

### 🎨 **PostCSS 8.4.35 + Autoprefixer 10.4.17**
**Purpose**: CSS processing and vendor prefixing

**Used For:**
- Tailwind CSS compilation
- Browser compatibility
- CSS optimization

---

## Technology Usage Map

### By Screen/Component

| Component | React | Framer Motion | Three.js | Zustand | Socket.IO | Canvas | CSS |
|-----------|-------|---------------|----------|---------|-----------|--------|-----|
| StartScreen | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| HomeScreen | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| LobbyScreen | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| GameScreen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TikiBoard | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| AvatarCarousel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| WindWhispers | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| DottedSurface | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| JungleAtmosphere | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### By Feature

| Feature | Primary Technology | Supporting Technologies |
|---------|-------------------|------------------------|
| 3D Game Board | Three.js | React, Zustand |
| Card Animations | Framer Motion | React |
| Real-time Multiplayer | Socket.IO | Zustand, React |
| State Management | Zustand | React |
| Wind Effects | HTML5 Canvas | React, requestAnimationFrame |
| 3D Lobby Island | Three.js | React, Framer Motion |
| Avatar Selection | Framer Motion | React, SVG |
| Background Particles | Three.js | React |
| UI Animations | Framer Motion | React, CSS |

---

## Performance Optimizations

### React
- `memo()` for expensive components
- `useMemo()` for computed values
- `useCallback()` for stable function references
- Lazy loading with code splitting

### Three.js
- Object pooling for particles
- Geometry instancing
- Efficient material reuse
- Shadow map optimization
- Frustum culling

### Canvas
- RequestAnimationFrame for smooth 60fps
- Particle recycling
- Minimal DOM manipulation
- Transform caching

### Framer Motion
- Hardware-accelerated transforms
- Will-change CSS hints
- Reduced motion support
- Stagger optimization

---

## Browser Compatibility

### Minimum Requirements
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- WebGL 2.0 support
- ES6+ JavaScript
- WebSocket support
- Canvas 2D API

### Accessibility
- `prefers-reduced-motion` support in WindWhispers
- Keyboard navigation support
- ARIA labels on interactive elements
- Screen reader friendly

---

## File Structure Summary

```
tiki-topple/
├── frontend/
│   ├── src/
│   │   ├── components/          # React UI components
│   │   ├── three/               # Three.js 3D components
│   │   ├── animations/          # Canvas animation systems
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # React Context (Socket.IO)
│   │   ├── store/               # Zustand state management
│   │   ├── data/                # Static data (avatars)
│   │   └── sounds/              # Audio assets
│   ├── public/                  # Static assets
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── vite.config.js           # Vite configuration
│   └── package.json             # Frontend dependencies
│
└── backend/
    ├── server.js                # Express + Socket.IO server
    ├── gameEngine.js            # Game logic
    ├── .env                     # Environment variables
    └── package.json             # Backend dependencies
```

---

## Summary

**Total Technologies: 15+**

**Frontend Stack:**
- React 18 (UI Framework)
- Framer Motion 11 (Animations)
- Three.js 0.162 (3D Graphics)
- Zustand 4 (State Management)
- Socket.IO Client 4 (Real-time Communication)
- HTML5 Canvas (2D Particle Effects)
- Tailwind CSS 3 (Styling Framework)
- Vite 5 (Build Tool)

**Backend Stack:**
- Node.js (Runtime)
- Express 4 (Web Server)
- Socket.IO 4 (WebSocket Server)
- UUID 9 (ID Generation)
- CORS 2 (Security)
- Dotenv 16 (Configuration)

**Development:**
- Nodemon 3 (Auto-reload)
- PostCSS 8 (CSS Processing)
- Autoprefixer 10 (Browser Compatibility)

This creates a modern, performant, real-time multiplayer game with premium 3D graphics and smooth animations.
