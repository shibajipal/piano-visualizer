<div align="center">

# Piano Visualizer

A stunning, interactive, and highly performant 3D Grand Piano built with React, Three.js, and Tone.js.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![Tone.js](https://img.shields.io/badge/Tone.js-Audio-ffb703?style=for-the-badge)](https://tonejs.github.io/)

---

<video src="assets/demo.mp4" width="700" autoplay loop muted playsinline>
  Your browser does not support the video tag.
</video>

</div>

<br>

## What is this project about?
**Piano Visualizer** is a high-performance 3D grand piano simulator and MIDI visualizer built entirely in the browser. It combines custom audio synthesis via Tone.js with an interactive 3D environment powered by React Three Fiber. 

The goal is to provide a seamless, lag-free experience where users can play a virtual 88-key piano using their computer keyboard, or drag-and-drop MIDI files to watch them rendered as a beautiful, Synthesia-style waterfall.

<br>

## Features
| Feature | Details |
|---|---|
| **High-Performance 3D Rendering** | Built on `three.js`, featuring an 88-key layout, clean geometry edges, and orbit controls. |
| **Synthesia-Style Waterfall** | Dynamic visualization of MIDI files with impact particles and dynamic mesh scaling. |
| **Audio Synthesis Engine** | Authentic, lag-free piano sounds synthesized dynamically using `Tone.js`. |
| **MIDI File Support** | Drag and drop or upload custom `.mid` files. Includes a built-in playback transport. |
| **Keyboard Playable** | Map your physical computer keyboard to the virtual piano, complete with octave shifting. |
| **Interactive 3D Keys** | Click or tap on the 3D keys directly to trigger notes with pointer lock support. |
| **Smooth Animations** | Uses `gsap` for buttery-smooth intro sequences and visual flair. |
| **Lean State Management** | Custom reactive state stores for decoupled audio/visual synchronization. |

<br>

## Project Structure
```
piano/
├── src/
│   ├── audio/            # Tone.js Synth Engine and MIDI playback scheduler
│   ├── components/       # React components (3D Canvas, UI, Intro Sequence)
│   ├── constants/        # Application-wide constants & palettes
│   ├── hooks/            # Custom React hooks (e.g., useKeyboardInput)
│   ├── store/            # Lightweight vanilla state management
│   ├── utils/            # Math and keyboard layout coordinate generators
│   └── App.tsx           # Main Application Shell & UI Dashboard
├── public/               # Static assets and preset MIDI files
├── index.html            # Entry HTML file
└── vite.config.ts        # Vite build configuration
```

<br>

### Prerequisites
- **Node.js 18+**
- Install dependencies:

```bash
npm install
```

### Installation
```bash
git clone https://github.com/your-username/piano-visualizer.git
cd piano-visualizer
npm install
```

### Usage
**Start the development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

<br>

### Keyboard Controls

| Action | Key(s) |
| :--- | :--- |
| **Play Middle Octave (C4 - E5)** | `A` ... `M` (Home row) |
| **Play Black Keys** | `W E T Y U O P` |
| **Shift 1 Octave HIGHER** | Hold `SHIFT` + Key |
| **Shift 1 Octave LOWER** | Hold `ALT` + Key |

<br>

## Architecture
- **Decoupled Audio & Visuals**: The `MidiPlayer` schedules notes strictly on `Tone.Transport` for sample-accurate audio timing. It uses `Tone.getDraw()` to synchronize the visual React state updates to the browser's animation frame.
- **Optimized Rendering**: The `WaterfallEngine` translates an entire grouped MIDI mesh downwards based on transport time, rather than updating individual box geometries every frame, reducing CPU overhead.
- **Event-driven Stores**: Stores bypass heavy React context layers. The 3D canvas polls the raw state, only triggering React updates when absolutely necessary.

<br>

## Dependencies
| Package | Purpose |
|---------|---------|
| [`three`](https://threejs.org/) | Core 3D rendering engine |
| [`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber/) | React wrapper for Three.js |
| [`@react-three/drei`](https://github.com/pmndrs/drei) | Useful helpers for R3F |
| [`tone`](https://tonejs.github.io/) | Web Audio framework for synthesis |
| [`@tonejs/midi`](https://github.com/Tonejs/Midi) | Parsing standard MIDI files into JSON |
| [`gsap`](https://gsap.com/) | High-performance animation library |

<br>

## License
This project is open source and available under the [MIT License](LICENSE).

<br>

