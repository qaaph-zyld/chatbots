
**Project Development Continuation Prompt**

**Objective**: Develop new features for the chatbot platform while strictly maintaining the reorganized structure, testing standards, and architectural patterns established during the MongoDB Memory Server integration. All work must comply with dev_framework v1.3 conventions.

**Key Requirements**:
1. **Architecture Compliance**:
   - Maintain modular structure: `src/core/`, `src/components/`, `tests/layered-structure`
   - Preserve MongoDB Memory Server testing patterns
   - Enforce 100% import path consistency using established aliases

2. **New Feature Development**:
   ```markdown
   - Implement conversation history pagination endpoint
   - Add message sentiment analysis microservice
   - Develop rate limiting middleware
   ```
   
3. **Quality Enforcement**:
   - Write Jest tests with MongoDB in-memory DB before implementation
   - Maintain 90%+ test coverage with Istanbul metrics
   - Include integration tests for all API endpoints
   - Validate cross-platform compatibility (Windows/macOS/Linux)

4. **Documentation Protocol**:
   - Update `docs/api-documentation.md` using OpenAPI 3.0 format
   - Add feature diagrams to `docs/architecture/`
   - Maintain changelog in `RELEASE_NOTES.md` (semantic versioning)

5. **Workflow Integration**:
   - Create feature branches from `development` (never `main`)
   - Include CI pipeline updates in same PR as feature code
   - Perform pre-commit linting with `eslint-config-framework`

**Deliverables**:
```json
{
  "implementation_plan": "Modular breakdown with dependency mapping",
  "test_strategy": "Matrix of unit/integration/e2e tests with MongoDB scenarios",
  "directory_structure": "Updated tree showing new file locations",
  "code_snippets": "Key implementation examples with JSDoc annotations",
  "migration_script": "Bash script for seamless feature integration",
  "docs_update_path": "List of documentation files requiring updates"
}
```

**Critical Constraints**:
- Zero regression in existing functionality
- All tests must pass with MongoDB Memory Server
- Strict adherence to `framework-eslint-rules`
- No hardcoded values - use `configs/env` only
- 100% backward compatibility with current API contracts
```

### Essential Considerations for Development:
1. **Framework Evolution**: Check for updates to [dev_framework](https://github.com/qaaph-zyld/dev_framework) weekly
2. **Performance Monitoring**: 
   - Add `benchmarks/` directory for load testing
   - Integrate memory leak detection in CI
3. **Security Compliance**:
   - Implement framework's new security advisories
   - Add OWASP ZAP scanning to pipeline
4. **Team Alignment**:
   - Conduct pairing sessions using framework's `docs/pair-programming-guide.md`
   - Use framework's PR template for code reviews
5. **Progressive Refinement**:
   - Schedule tech debt sprints every 3 iterations
   - Maintain framework's `TECH_DEBT.md` ledger

**Next-Step Recommendation**:  
Initiate with the sentiment analysis feature since it has:  
✅ Clear isolation boundaries  
✅ Natural fit with existing message schema  
✅ Low-risk integration path  
✅ Framework's NLP implementation patterns available in `docs/patterns/nlp-service.md`

Remember to run the framework's `compliance-check.sh` before PR submission!
