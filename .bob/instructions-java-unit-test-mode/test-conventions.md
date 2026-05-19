# Test Conventions for order-service

## Naming Conventions

Based on existing tests in this repository:

### Test Class Names
- Pattern: `{ClassName}Test`
- Example: `OrderServiceTest`, `OrderControllerTest`

### Test Method Names
- Pattern: `methodName_scenario_expectedBehavior`
- Examples:
  - `createOrder_validOrder_returnsCreatedOrder`
  - `getOrderById_existingId_returnsOrder`
  - `getOrderById_nonExistingId_returnsEmpty`
  - `updateOrderStatus_invalidTransition_throwsException`

## Assertion Style

**Use AssertJ** for all assertions:

```java
// Good - AssertJ style
assertThat(result).isNotNull();
assertThat(result.getId()).isEqualTo(1L);
assertThat(result.getStatus()).isEqualTo("PENDING");
assertThat(orders).hasSize(1);
assertThat(result).isPresent();
assertThat(result).isEmpty();

// Avoid - JUnit assertions
assertEquals(1L, result.getId());
assertTrue(result != null);
```

## Mocking Patterns

### Service Layer Tests

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    
    @Mock
    private OrderRepository orderRepository;
    
    @InjectMocks
    private OrderService orderService;
    
    private Order testOrder;
    
    @BeforeEach
    void setUp() {
        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setCustomerName("John Doe");
        testOrder.setProduct("Widget");
        testOrder.setAmount(new BigDecimal("29.99"));
        testOrder.setStatus("PENDING");
    }
    
    @Test
    void createOrder_setsDefaultStatus() {
        Order newOrder = new Order();
        newOrder.setCustomerName("Jane");
        newOrder.setProduct("Gadget");
        newOrder.setAmount(new BigDecimal("49.99"));
        
        when(orderRepository.save(any(Order.class))).thenReturn(newOrder);
        
        Order created = orderService.createOrder(newOrder);
        assertThat(created.getStatus()).isEqualTo("PENDING");
    }
}
```

### Controller Layer Tests

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private OrderService orderService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void createOrder_validOrder_returns201() throws Exception {
        Order order = new Order();
        order.setCustomerName("Bob");
        order.setProduct("Thing");
        order.setAmount(new BigDecimal("19.99"));
        order.setStatus("PENDING");
        
        when(orderService.createOrder(any(Order.class))).thenReturn(order);
        
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(order)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerName").value("Bob"));
    }
}
```

## Test Structure

Follow the **Given-When-Then** pattern (implicit in the code structure):

```java
@Test
void getOrderById_existingId_returnsOrder() {
    // Given - Setup test data and mocks
    when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
    
    // When - Execute the method under test
    Optional<Order> result = orderService.getOrderById(1L);
    
    // Then - Verify the results
    assertThat(result).isPresent();
    assertThat(result.get().getProduct()).isEqualTo("Widget");
}
```

## Common Setup

Use `@BeforeEach` for common test setup:

```java
private Order testOrder;

@BeforeEach
void setUp() {
    testOrder = new Order();
    testOrder.setId(1L);
    testOrder.setCustomerName("John Doe");
    testOrder.setProduct("Widget");
    testOrder.setAmount(new BigDecimal("29.99"));
    testOrder.setStatus("PENDING");
}
```

## Coverage Guidelines

For each method, write tests for:

1. **Happy path** - Normal successful execution
2. **Edge cases** - Boundary conditions, empty inputs, null values
3. **Error scenarios** - Expected exceptions, validation failures
4. **Business logic branches** - All conditional paths

## Exception Testing

Use AssertJ's `assertThatThrownBy`:

```java
@Test
void updateOrderStatus_invalidTransition_throwsException() {
    when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
    
    assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "DELIVERED"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Cannot transition from PENDING to DELIVERED");
}
```

## Verification

Use Mockito's `verify()` to ensure methods were called:

```java
@Test
void deleteOrder_callsRepository() {
    orderService.deleteOrder(1L);
    verify(orderRepository).deleteById(1L);
}
```

## Key Observations from Existing Tests

1. **No @DisplayName** annotations - use descriptive method names instead
2. **No @Nested** classes - flat test structure
3. **Simple, focused tests** - one assertion concept per test
4. **Consistent formatting** - clear separation between setup, execution, and verification
5. **Meaningful test data** - use realistic names like "John Doe", "Widget", etc.