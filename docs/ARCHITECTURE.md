# ZMusic Architecture Documentation

## Overview
ZMusic uses a proper MVC (Model-View-Controller) architecture with separation of concerns, following industry-standard patterns.

## Architecture Layers

### 1. Model Layer (`src/models/`)
- **Purpose**: Entity definitions and data structures
- **Responsibility**: Define business entities with proper interfaces
- **Pattern**: Active Record Pattern
- **Files**:
  - `music.model.ts` - Music entity with full type definitions
  - `lyrics.model.ts` - Lyrics entity
  - `mv.model.ts` - MV (Music Video) entity

### 2. Repository Layer (`src/repositories/`)
- **Purpose**: Data Access Layer
- **Responsibility**: CRUD operations, data persistence
- **Pattern**: Repository Pattern (ORM abstraction)
- **Files**:
  - `music.repository.ts` - Music data access
  - `lyrics.repository.ts` - Lyrics data access
  - `user.repository.ts` - User data access

### 3. Service Layer (`src/services/`)
- **Purpose**: Business Logic Layer
- **Responsibility**: Core business logic, agent integration
- **Pattern**: Service Layer Pattern
- **Files**:
  - `music.service.ts` - Music generation business logic
  - `lyrics.service.ts` - Lyrics generation logic
  - `agent.service.ts` - Unicorn agent orchestration
  - `suno.service.ts` - Suno AI integration
  - `muse.service.ts` - Muse AI integration

### 4. Controller Layer (`src/controllers/`)
- **Purpose**: Request Handler Layer
- **Responsibility**: Handle HTTP requests, delegate to services
- **Pattern**: Controller Pattern
- **Files**:
  - `music.controller.ts` - Music endpoints handler
  - `lyrics.controller.ts` - Lyrics endpoints handler
  - `mv.controller.ts` - MV endpoints handler

### 5. Routes Layer (`src/routes/`)
- **Purpose**: Route Definitions
- **Responsibility**: Map HTTP endpoints to controllers
- **Pattern**: Router Pattern
- **Files**:
  - `music.routes.ts` - Music route definitions
  - `index.ts` - Central route registry

### 6. Core Layer (`src/core/`)
- **Purpose**: Infrastructure and Foundation
- **Responsibility**: Database, configuration, DI container
- **Pattern**: Infrastructure Layer Pattern
- **Files**:
  - `database.ts` - JSON-based ORM implementation
  - `config.ts` - Configuration management
  - `di.ts` - Dependency Injection container (future)

### 7. Utils Layer (`src/utils/`)
- **Purpose**: Utility Functions
- **Responsibility**: Logging, validation, helpers
- **Files**:
  - `logger.ts` - Log4j-style logging implementation
  - `validator.ts` - Input validation
  - `helpers.ts` - Common utilities

## Database Implementation

### ORM Pattern
- **Type**: JSON-based database for simplicity
- **Pattern**: Repository Pattern with BaseRepository
- **Features**:
  - CRUD operations abstraction
  - Collection-based storage
  - Auto-save on modifications
  - Type-safe operations

### Benefits
- No external database dependency
- Easy to migrate to SQL/NoSQL later
- Perfect for prototype and small applications
- Type-safe with TypeScript

## Testing Architecture

### Unit Tests (`tests/unit/`)
- Test business logic in isolation
- Mock dependencies
- JUnit-style assertions

### Integration Tests (`tests/integration/`)
- Test API endpoints
- Test service-repository integration
- End-to-end flow verification

### E2E Tests (`tests/e2e/`)
- Test complete user workflows
- Browser automation
- Real API calls

## Build Automation

### Web Build
- TypeScript compilation
- Vite bundling
- Output: `dist/web`

### Android APK (Capacitor)
- Mobile wrapper
- Native bridge
- Output: `dist/android`

### Windows EXE (Electron)
- Desktop wrapper
- Cross-platform
- Output: `dist/windows`

## Agent Integration

### Unicorn Agent Architecture
- **Hermes Agent**: Message routing
- **OpenClaw Agent**: Task execution
- **Unicorn Agent**: Hybrid coordination

### FSM Programming Concept
- State transitions for music structure
- If-Then logic for section changes
- AND/OR gates for condition evaluation

### Network Layer Concept
- Layer 1: Foundation (drums, bass)
- Layer 2: Melody (chords, harmony)
- Layer 3: Expression (vocals, lyrics)
- Layer 4: Effects (production polish)

## Comparison with Previous Architecture

### Previous Issues
1. Monolithic server.js
2. No separation of concerns
3. No database abstraction
4. No business logic layer
5. Hard to test
6. Hard to scale

### Current Benefits
1. Proper MVC separation
2. Repository pattern for data
3. Service layer for logic
4. Controller layer for requests
5. Testable architecture
6. Scalable structure
7. Industry-standard patterns
8. Clear responsibilities

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Backend**: Express.js
- **Database**: JSON-based ORM (migratable to SQL)
- **Testing**: Vitest (JUnit-style)
- **Logging**: Custom Log4j-style implementation
- **Build**: Vite, Capacitor, Electron
- **Agents**: Unicorn/Hermes/OpenClaw from ANNA AI
- **AI Providers**: Suno AI + Muse AI

## API Endpoints

### Music Endpoints
- `POST /api/music/create` - Create music task
- `POST /api/music/generate/:id` - Generate music
- `GET /api/music/:id` - Get music by ID
- `GET /api/music/all` - Get all music

### Health Endpoint
- `GET /api/health` - Health check

## Future Improvements

1. Add SQL database support (PostgreSQL/MySQL)
2. Implement proper DI container
3. Add authentication middleware
4. Implement proper ORM (TypeORM/Prisma)
5. Add API documentation (Swagger)
6. Implement caching layer
7. Add monitoring and metrics
8. Deploy to cloud (AWS/GCP)