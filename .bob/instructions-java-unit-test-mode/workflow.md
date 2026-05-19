# Java Unit Test Mode - Workflow

## Step-by-Step Process

### 1. Understand the Request

When the user asks you to write tests:
- Identify the target class (service, controller, repository, etc.)
- Determine the scope (specific methods or entire class)
- Note any special requirements (edge cases, specific scenarios)

### 2. Analyze Existing Tests

**ALWAYS** read existing tests before writing new ones:

```
Read: order-service/src/test/java/com/example/orders/service/OrderServiceTest.java
Read: order-service/src/test/java/com/example/orders/controller/OrderControllerTest.java
```

Look for:
- Test class structure and annotations
- Naming patterns for test methods
- How mocks are set up (`@Mock`, `@MockBean`)
- Assertion style (should be AssertJ)
- Common setup patterns (`@BeforeEach`)
- How test data is created

### 3. Read the Source Code

Read the class you're testing to understand:
- Method signatures and parameters
- Return types
- Dependencies (what needs to be mocked)
- Business logic and edge cases
- Exception handling

### 4. Plan Test Coverage

Identify test scenarios:
- **Happy path**: Normal successful execution
- **Edge cases**: Empty lists, null values, boundary conditions
- **Error cases**: Invalid input, exceptions, validation failures
- **Business rules**: All conditional branches

### 5. Write the Tests

Follow the established conventions:

```java
@ExtendWith(MockitoExtension.class)
class NewServiceTest {
    
    @Mock
    private DependencyRepository repository;
    
    @InjectMocks
    private NewService service;
    
    private TestData testData;
    
    @BeforeEach
    void setUp() {
        testData = new TestData();
        testData.setId(1L);
        testData.setName("Test Name");
    }
    
    @Test
    void methodName_scenario_expectedBehavior() {
        // Given
        when(repository.method()).thenReturn(testData);
        
        // When
        Result result = service.method();
        
        // Then
        assertThat(result).isNotNull();
        verify(repository).method();
    }
}
```

### 6. Verify Test Quality

Ensure your tests:
- ✅ Follow naming conventions from existing tests
- ✅ Use AssertJ for assertions
- ✅ Use Mockito properly (don't over-mock)
- ✅ Have clear Given-When-Then structure
- ✅ Test one thing per test method
- ✅ Are independent (no test depends on another)
- ✅ Have meaningful test names that describe the scenario

## Example Workflow

**User Request**: "Write tests for the OrderService.updateOrder method"

**Your Process**:

1. **Read existing tests**:
   ```
   Read: order-service/src/test/java/com/example/orders/service/OrderServiceTest.java
   ```

2. **Read the source**:
   ```
   Read: order-service/src/main/java/com/example/orders/service/OrderService.java
   ```

3. **Identify scenarios**:
   - Update existing order successfully
   - Update with non-existing ID (should throw exception)
   - Update with null order (should throw exception)
   - Update with invalid data (should throw validation exception)

4. **Write tests** matching the existing pattern:
   ```java
   @Test
   void updateOrder_existingOrder_returnsUpdatedOrder() {
       // Given
       Order existingOrder = new Order();
       existingOrder.setId(1L);
       existingOrder.setCustomerName("Old Name");
       
       Order updatedOrder = new Order();
       updatedOrder.setId(1L);
       updatedOrder.setCustomerName("New Name");
       
       when(orderRepository.findById(1L)).thenReturn(Optional.of(existingOrder));
       when(orderRepository.save(any(Order.class))).thenReturn(updatedOrder);
       
       // When
       Order result = orderService.updateOrder(1L, updatedOrder);
       
       // Then
       assertThat(result).isNotNull();
       assertThat(result.getCustomerName()).isEqualTo("New Name");
       verify(orderRepository).findById(1L);
       verify(orderRepository).save(any(Order.class));
   }
   ```

## Common Patterns

### Testing Service Methods

```java
@Test
void serviceMethod_scenario_expectedBehavior() {
    // Given - Mock repository responses
    when(repository.method()).thenReturn(expectedValue);
    
    // When - Call service method
    Result result = service.method(input);
    
    // Then - Assert and verify
    assertThat(result).isNotNull();
    verify(repository).method();
}
```

### Testing Controller Endpoints

```java
@Test
void endpoint_scenario_expectedBehavior() throws Exception {
    // Given - Mock service responses
    Order order = new Order();
    order.setId(1L);
    order.setCustomerName("John");
    when(orderService.method()).thenReturn(order);
    
    // When & Then - Perform request and verify response
    mockMvc.perform(get("/api/orders/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1))
        .andExpect(jsonPath("$.customerName").value("John"));
}
```

### Testing Exception Scenarios

```java
@Test
void method_invalidInput_throwsException() {
    // Given
    when(orderRepository.findById(999L)).thenReturn(Optional.empty());
    
    // When & Then
    assertThatThrownBy(() -> orderService.getOrderById(999L))
        .isInstanceOf(OrderNotFoundException.class)
        .hasMessageContaining("Order not found");
}
```

## Tips

- **Don't over-mock**: Only mock external dependencies, not the class under test
- **Use meaningful test data**: Names like "John Doe" are better than "test1"
- **Keep tests focused**: One assertion concept per test
- **Make tests readable**: Clear variable names, good structure
- **Test behavior, not implementation**: Focus on what the method does, not how
- **Match existing patterns**: Consistency is key in this codebase