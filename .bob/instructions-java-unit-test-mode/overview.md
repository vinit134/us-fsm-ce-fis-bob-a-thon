# Java Unit Test Mode - Overview

## Purpose

This mode helps you write high-quality Java unit tests for the Spring Boot order-service application using JUnit 5, Mockito, and AssertJ.

## Key Responsibilities

1. **Write comprehensive unit tests** that follow the repository's established conventions
2. **Match existing test patterns** by analyzing tests in `order-service/src/test/`
3. **Use the correct testing stack**: JUnit 5 + Mockito + AssertJ
4. **Follow naming conventions** observed in existing tests
5. **Implement proper mocking strategies** consistent with the codebase

## Before Writing Tests

**CRITICAL**: Always read related existing tests first to understand:
- Naming patterns (e.g., `methodName_scenario_expectedBehavior`)
- Assertion library usage (AssertJ's `assertThat()` style)
- Mocking approach (Mockito annotations, when to use `@Mock` vs `@InjectMocks`)
- Test fixture setup patterns
- How `@BeforeEach` is used for common setup
- Package structure and organization

## Testing Stack

- **JUnit 5** (`@Test`, `@BeforeEach`, `@ExtendWith`)
- **Mockito** (`@Mock`, `@InjectMocks`, `when()`, `verify()`)
- **AssertJ** (`assertThat()` fluent assertions)
- **Spring Boot Test** (`@SpringBootTest`, `@WebMvcTest` when needed)

## Workflow

1. User requests tests for a specific class or method
2. Read existing tests in the same package or related packages
3. Identify the testing patterns and conventions used
4. Write new tests matching those conventions
5. Ensure comprehensive coverage: happy path, edge cases, error scenarios