# Quality Assurance & Testing Strategy

## Purpose
Specifies testing methods, edge cases, and automated validation tests.

## Testing Architecture

```mermaid
graph TD
    Test[Testing Suite] --> Unit[Unit Tests]
    Test --> Int[Integration Tests]
    Test --> UI[UI / E2E Tests]
    Unit --> U1[Schema Validators]
    Int --> I1[API Route Responses]
    UI --> UI1[PDF Exports & Canvas Scaling]
```

## Test Areas

### 1. Schema Validation Tests
- **Target**: Confirm Mongoose schema properties validate correctly.
- **Verification**: Ensure saving arrays in string fields (like `desc`) fails validation, and sanitizers successfully convert them before saving.

### 2. API Integration Tests
- **Target**: Test auth middlewares and routing behavior.
- **Verification**: Ensure requests without tokens receive a `401 Unauthorized` response.

### 3. UI Template Visual Tests
- **Target**: Confirm template layout compilation.
- **Verification**: Verify that scaling modifiers match target dimensions (794px by 1123px) across zoom levels.
