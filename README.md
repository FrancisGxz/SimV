# Cube Molecule Simulation

A browser-based 3D simulation built with TypeScript and Three.js.

The simulation models a cloud of moving and rotating cubes representing atoms. Cubes collide inside a bounded volume and can bond through matching colored faces to form larger rigid molecules.

## Goals

- Moving and rotating cubes inside a closed cubic volume
- Six differently colored faces with visible normals
- Wall and cube collision detection
- Collision response and bonding between matching exposed faces
- Response accounts for each molecule's center of mass, mass distribution, and resulting inertia
- Mouse spawning and molecule grabbing
- Configurable cube count
- Support for thousands of cubes at interactive framerates

## Tech Stack

TypeScript, Three.js, Vite, Vitest

## Installation

Requires Node.js and npm. The localhost port used will be listed in the terminal (often at http://localhost:5173/)

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm run test:run
```

## Controls

### Camera

- `W / S` — Forward / backward
- `A / D` — Left / right
- `Q / E` — Down / up
- `Shift` — Faster movement
- Right mouse button — Look around

### Interaction

- Left-click empty space — Spawn a cube
- Left-click and hold a cube — Grab its molecule
- Drag while holding — Move the molecule
- Release — Return the molecule to the simulation

The UI also provides world extent, cube count, initial speed/spin, reset, pause/resume, and single-frame controls.

## Nice to Have

Some functionality was added beyond the core simulation requirements:

- Free-fly camera controller
- Interactive dragging of grabbed molecules
- Maximum grab distance
- Pause/resume and single-frame stepping
- Runtime world, speed, and rotation controls
- Live FPS, body, cube, collision, and batch statistics

## Primary Tools & Concepts

Three.js instanced rendering, fixed-timestep simulation, spatial partitioning, OBB/SAT collision detection, vectors, dot/cross products, matrices, quaternions, local/world transforms, collision impulses, linear/angular momentum, center of mass, inertia tensors, and the parallel axis theorem.

## Possible Improvements

Collision detection is distributed across multiple frames using a simple spatial-cell batching approach. This is a rudimentary way of spreading expensive work over time. It can produce uneven workloads and sacrifices some temporal accuracy, but is considered sufficient for this simulation rather than implementing a full physics engine.

The simulation assumes uniform unit-sized cubes in several places. Supporting different dimensions would require further review of the broad phase, mass/inertia calculations, face positioning, bonding, and collision handling to ensure individual dimensions are handled correctly.

World-boundary handling could also be improved for molecules that grow close to or beyond the dimensions of the simulation volume.

Testing currently covers core simulation behavior, but more tests could be added around collision, bonding, interaction, and edge cases. The practical limits of the simulation have also not been exhaustively tested. Maximum cube counts, world extents, linear/angular speeds, and combinations of these parameters would need additional stress testing.

Further work could include better collision-batch balancing, additional profiling of hot paths, and more polished mouse interactions and UI.

---

# AI Usage & Development Process

AI was used as a development aid rather than as the source of the project's architecture.

I first broke the assignment requirements into implementation steps and responsibilities, similar to the notes and task lists I would normally write on paper before and during development. AI was useful for organizing and validating these steps as the implementation progressed. AI suggestions were reviewed, tested, and adapted based on the actual behavior and performance of the simulation.

A local model installed in early 2025 was used in a Copilot-style role, primarily for autocomplete and boilerplate after classes, functions, and intended behavior had been defined.

My personal ChatGPT license was primarily used as an engineering sounding board for architecture, theoretical questions, debugging, and performance analysis. It also replaced much of the workflow that would traditionally involve Google searches, documentation, Stack Overflow/forum threads, and finding small examples or snippets to understand and adapt.

The representative prompts and answers below were reconstructed by asking ChatGPT to review our development conversation and select examples that reflected how it was used. They are condensed for readability rather than presented as verbatim transcripts.

### Representative Discussions

> **Prompt:** I was thinking a Body could represent both an atom and a molecule. A Body with one Cube is an atom, and when they bond the cubes become local parts of the same Body. Does that architecture avoid multiple layers?
>
> **Answer:** Yes. It gives both cases the same rigid-body representation and avoids separate atom and molecule hierarchies. Bonding can merge bodies while preserving cubes as local parts of the resulting body.

> **Prompt:** For thousands of same-sized cubes moving all the time inside a fixed box, wouldn't a uniform grid make more sense than an octree?
>
> **Answer:** Yes. The bounded environment, uniform object size, and continuously moving objects make a uniform spatial grid a good fit while keeping rebuilding and querying relatively simple.

> **Prompt:** I'm more familiar with game engine rendering than Three.js. In games I'd want to avoid creating and updating thousands of individual render objects and use some form of instancing instead. What is the Three.js equivalent?
>
> **Answer:** Yes. Three.js provides `InstancedMesh`, allowing shared geometry/materials with individual transforms. This fits the cubes and normals while avoiding thousands of separate Three.js render objects.

> **Prompt:** I don't need a full physics engine. Can I distribute collision checks across several frames if the approximation is accurate enough for a realistic simulation?
>
> **Answer:** Yes. Time-slicing collision work sacrifices some temporal accuracy but is a reasonable performance tradeoff for this type of visual simulation.



