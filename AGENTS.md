# AGENTS.md - Specialized Agents for OpenRouter Models Explorer

This document describes specialized agents that can be leveraged for development, testing, and maintenance of the OpenRouter Models Explorer application.

## Available Agents

### 1. Frontend Developer Agent
**Purpose**: Build React components, implement responsive layouts, and handle client-side state management.
**When to Use**: 
- Creating new UI components
- Modifying existing React components
- Implementing responsive design improvements
- Adding new features to the user interface

**Example Tasks**:
- Create a new model comparison feature
- Implement dark mode toggle
- Add advanced filtering options
- Improve mobile responsiveness

### 2. Test Automator Agent
**Purpose**: Create comprehensive test suites with unit, integration, and e2e tests.
**When to Use**:
- Adding test coverage for new features
- Setting up CI pipelines
- Implementing mocking strategies
- Creating test data

**Example Tasks**:
- Write unit tests for new filtering functions
- Create integration tests for API calls
- Set up end-to-end testing with Cypress
- Implement test utilities for model data

### 3. Code Reviewer Agent
**Purpose**: Review code for quality, security, and maintainability.
**When to Use**:
- After implementing new features
- Before merging pull requests
- When refactoring existing code
- To ensure code quality standards

**Example Tasks**:
- Review new component implementations
- Check for potential performance issues
- Identify security vulnerabilities
- Ensure adherence to coding standards

### 4. Debugger Agent
**Purpose**: Debug errors, test failures, and unexpected behavior.
**When to Use**:
- When encountering runtime errors
- Investigating test failures
- Debugging UI issues
- Analyzing performance problems

**Example Tasks**:
- Debug failing unit tests
- Investigate API integration issues
- Analyze performance bottlenecks
- Fix rendering problems in components

### 5. DX Optimizer Agent
**Purpose**: Improve developer experience, tooling, setup, and workflows.
**When to Use**:
- Setting up new development environments
- Improving build processes
- Optimizing development workflows
- After receiving team feedback on friction points

**Example Tasks**:
- Optimize Vite configuration
- Improve development server startup time
- Set up better linting and formatting rules
- Create VS Code snippets and configurations

### 6. Architect Reviewer Agent
**Purpose**: Reviews code changes for architectural consistency and patterns.
**When to Use**:
- After making structural changes
- When adding new services or APIs
- Before major refactoring efforts
- To ensure SOLID principles and maintainability

**Example Tasks**:
- Review data flow architecture
- Check component structure and organization
- Ensure proper separation of concerns
- Validate state management patterns

## Agent Usage Examples

### Adding a New Filter Option

1. **Frontend Developer Agent**: Implement the UI components for the new filter
2. **Test Automator Agent**: Write tests for the new filtering functionality
3. **Code Reviewer Agent**: Review the implementation for quality and best practices
4. **DX Optimizer Agent**: Ensure the new feature integrates well with existing development workflows

### Performance Optimization

1. **Debugger Agent**: Identify performance bottlenecks in model filtering or rendering
2. **Frontend Developer Agent**: Implement optimizations like memoization or virtualization
3. **Test Automator Agent**: Create performance benchmarks and regression tests
4. **Architect Reviewer Agent**: Review changes for architectural impact

## Best Practices

1. **Sequential Usage**: Use agents in a logical sequence (implementation → testing → review)
2. **Specific Instructions**: Provide clear, detailed instructions to each agent about what you need
3. **Verification**: Always verify the output of agents before integrating into the codebase
4. **Documentation**: Update this document when new agent workflows are established

## Integration with Development Workflow

1. **Feature Development**: 
   - Frontend Developer → Test Automator → Code Reviewer
   
2. **Bug Fixing**:
   - Debugger → Frontend Developer → Test Automator
   
3. **Refactoring**:
   - Architect Reviewer → Frontend Developer → Test Automator → Code Reviewer
   
4. **Performance Work**:
   - Debugger → Frontend Developer → Test Automator → DX Optimizer