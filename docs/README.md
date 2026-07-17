# Hangman AI Documentation

This folder contains the project documentation in one place. Use this file as the entry point and follow the linked guides based on what you need.

## Quick Navigation

| Document | Purpose |
| --- | --- |
| [architecture_overview.md](./architecture_overview.md) | High-level system architecture across frontend, backend, database, and socket flow |
| [deployment_guide.md](./deployment_guide.md) | Deployment steps for Vercel, Render, MongoDB Atlas, and environment variables |
| [file_structure_details.md](./file_structure_details.md) | Folder-by-folder explanation of the codebase |
| [socket_multiplayer.md](./socket_multiplayer.md) | Detailed explanation of the real-time multiplayer room lifecycle |
| [api_reference.md](./api_reference.md) | REST endpoint reference for auth and game APIs |
| [local_development.md](./local_development.md) | Local setup, install, run commands, and troubleshooting |
| [game_modes.md](./game_modes.md) | Behavior of each game mode and how the game loop differs |
| [presentation_notes.md](./presentation_notes.md) | Demo and presentation notes |
| [final_changes_roadmap.md](./final_changes_roadmap.md) | Remaining high-impact product and resume improvements |
| [ai_benchmark.md](./ai_benchmark.md) | Reproducible AI evaluation process and latest benchmark results |
| [ai_algorithm/overview.md](./ai_algorithm/overview.md) | AI module index and algorithm summary |
| [ai_algorithm/frequency_model.md](./ai_algorithm/frequency_model.md) | Easy difficulty frequency strategy |
| [ai_algorithm/heuristic_model.md](./ai_algorithm/heuristic_model.md) | Medium difficulty heuristic strategy |
| [ai_algorithm/shannon_entropy.md](./ai_algorithm/shannon_entropy.md) | Hard difficulty entropy strategy |

## Recommended Reading Order

If you are new to the project:

1. Read [architecture_overview.md](./architecture_overview.md).
2. Read [file_structure_details.md](./file_structure_details.md).
3. Read [local_development.md](./local_development.md).
4. Read [api_reference.md](./api_reference.md) and [socket_multiplayer.md](./socket_multiplayer.md) if you will work on gameplay.

## Project Summary

Hangman AI is a MERN-style full-stack project with:

- A React + Vite frontend
- A Node.js + Express backend
- Optional MongoDB persistence
- Socket.io-based multiplayer rooms
- An AI word guessing engine with easy, medium, and hard strategies

Current operational highlights:

- root `npm run dev` starts backend and frontend together
- auth and leaderboard require MongoDB plus a valid `JWT_SECRET`
- production frontend builds require `VITE_API_URL`
- production backend CORS requires `CLIENT_URL`

## Source of Truth

The docs aim to match the code currently in:

- `backend/server.js`
- `backend/controllers/`
- `backend/routes/`
- `backend/socket/gameSocket.js`
- `backend/services/aiService.js`
- `frontend/src/`

If a document and the code disagree, treat the code as the source of truth and update the relevant document.
