<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Scorpius Security Platform - Copilot Instructions

## Project Overview
This is the Scorpius Security Platform - a comprehensive blockchain security analysis platform that combines:
- **Backend**: Python FastAPI with vulnerability scanning (Slither, MythX)
- **Frontend**: React/Next.js enterprise dashboard
- **Infrastructure**: Docker Compose with PostgreSQL, Redis, Nginx
- **Blockchain**: Foundry/Anvil for simulation

## Code Style & Standards

### Python Backend (backend/)
- Use FastAPI for API endpoints
- Follow PEP 8 style guidelines
- Use type hints for all functions
- Implement proper error handling with custom exceptions
- Use SQLAlchemy for database operations
- Structure code with clear separation of concerns:
  - `models/` - Database models
  - `schemas/` - Pydantic schemas
  - `services/` - Business logic
  - `api/` - API endpoints
  - `core/` - Configuration and utilities

### TypeScript Frontend (frontend/)
- Use React with TypeScript
- Follow Next.js 13+ app router conventions
- Use Tailwind CSS for styling
- Implement proper component composition
- Use React Query for server state management
- Structure components with clear prop interfaces
- Use shadcn/ui components where applicable

### Docker & Infrastructure
- Use multi-stage builds for optimization
- Implement proper health checks
- Use environment variables for configuration
- Follow Docker best practices for security
- Use Docker Compose for local development

## Security Considerations
- Always validate and sanitize user inputs
- Use proper authentication and authorization
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Follow OWASP security guidelines
- Validate smart contract inputs before scanning

## Key Features to Maintain
1. **Vulnerability Scanning**: Slither and MythX integration
2. **Real-time Updates**: WebSocket connections for live data
3. **MEV Simulation**: Foundry/Anvil blockchain simulation
4. **Enterprise Dashboard**: Professional UI with multiple views
5. **API Coverage**: 127 REST endpoints with comprehensive functionality
6. **No Mock Data**: All data comes from real backend services

## Development Patterns
- Use dependency injection for services
- Implement proper logging with structured formats
- Use async/await patterns for I/O operations
- Implement proper error boundaries in React
- Use environment-specific configurations
- Follow RESTful API design principles

## Testing Guidelines
- Write unit tests for business logic
- Use pytest for Python backend testing
- Use Jest/RTL for React component testing
- Implement integration tests for API endpoints
- Use Docker for consistent test environments

## Performance Considerations
- Use Redis for caching frequently accessed data
- Implement database query optimization
- Use lazy loading for React components
- Optimize Docker images for faster builds
- Use CDN for static assets in production

When suggesting code changes, always consider:
1. Security implications
2. Performance impact
3. Maintainability
4. Consistency with existing patterns
5. Enterprise-grade requirements
