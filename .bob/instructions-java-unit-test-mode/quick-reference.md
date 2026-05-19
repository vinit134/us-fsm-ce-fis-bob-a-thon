# Quick Reference - Java Unit Testing

## Essential Imports

```java
// JUnit 5
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;

// Mockito
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

// AssertJ
import static org.assertj.core.api.Assertions.*;

// Spring Boot Test (for controllers)
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
```

## Test Class Template

```java
@ExtendWith(MockitoExtension.class)
class ServiceNameTest {
    
    @Mock
    private DependencyRepository repository;
    
    @InjectMocks
    private ServiceName service;
    
    private TestDataObject testData;
    
    @BeforeEach
    void setUp() {
        testData = new TestDataObject();
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

## Common Mockito Patterns

```java
// Return a value
when(mock.method()).thenReturn(value);

// Return different values on successive calls
when(mock.method()).thenReturn(value1, value2);

// Throw an exception
when(mock.method()).thenThrow(new RuntimeException("Error"));

// Match any argument
when(mock.method(any())).thenReturn(value);
when(mock.method(any(Order.class))).thenReturn(value);
when(mock.method(anyLong())).thenReturn(value);
when(mock.method(anyString())).thenReturn(value);

// Return Optional
when(mock.findById(1L)).thenReturn(Optional.of(entity));
when(mock.findById(99L)).thenReturn(Optional.empty());

// Verify method was called
verify(mock).method();
verify(mock, times(2)).method();
verify(mock, never()).method();

// Verify with argument matchers
verify(mock).method(eq(expectedValue));
verify(mock).method(any(Order.class));

// Capture arguments
ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
verify(mock).method(captor.capture());
Order captured = captor.getValue();
```

## Common AssertJ Assertions

```java
// Basic assertions
assertThat(actual).isNotNull();
assertThat(actual).isNull();
assertThat(actual).isEqualTo(expected);
assertThat(actual).isNotEqualTo(other);

// Boolean assertions
assertThat(condition).isTrue();
assertThat(condition).isFalse();

// String assertions
assertThat(string).isEqualTo("expected");
assertThat(string).contains("substring");
assertThat(string).startsWith("prefix");
assertThat(string).endsWith("suffix");
assertThat(string).isEmpty();
assertThat(string).isNotEmpty();

// Collection assertions
assertThat(list).isEmpty();
assertThat(list).isNotEmpty();
assertThat(list).hasSize(3);
assertThat(list).contains(element);
assertThat(list).containsExactly(elem1, elem2);
assertThat(list).containsExactlyInAnyOrder(elem1, elem2);

// Optional assertions
assertThat(optional).isPresent();
assertThat(optional).isEmpty();
assertThat(optional.get()).isEqualTo(expected);

// Exception assertions
assertThatThrownBy(() -> service.method())
    .isInstanceOf(IllegalStateException.class)
    .hasMessageContaining("Cannot transition");

assertThatCode(() -> service.method())
    .doesNotThrowAnyException();

// Object field assertions
assertThat(order.getId()).isEqualTo(1L);
assertThat(order.getCustomerName()).isEqualTo("John Doe");
assertThat(order.getStatus()).isEqualTo("PENDING");
```

## Controller Test Template

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
    void getOrder_existingId_returnsOrder() throws Exception {
        // Given
        Order order = new Order();
        order.setId(1L);
        order.setCustomerName("John");
        when(orderService.getOrderById(1L)).thenReturn(Optional.of(order));
        
        // When & Then
        mockMvc.perform(get("/api/orders/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.customerName").value("John"));
    }
    
    @Test
    void createOrder_validOrder_returns201() throws Exception {
        // Given
        Order order = new Order();
        order.setCustomerName("Bob");
        order.setProduct("Thing");
        order.setAmount(new BigDecimal("19.99"));
        
        when(orderService.createOrder(any(Order.class))).thenReturn(order);
        
        // When & Then
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(order)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.customerName").value("Bob"));
    }
}
```

## Common Test Scenarios

### Service Layer

```java
// Happy path
@Test
void getAllOrders_returnsAllOrders() {
    when(orderRepository.findAll()).thenReturn(Arrays.asList(testOrder));
    List<Order> orders = orderService.getAllOrders();
    assertThat(orders).hasSize(1);
}

// Entity exists
@Test
void getOrderById_existingId_returnsOrder() {
    when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
    Optional<Order> result = orderService.getOrderById(1L);
    assertThat(result).isPresent();
}

// Entity not found
@Test
void getOrderById_nonExistingId_returnsEmpty() {
    when(orderRepository.findById(99L)).thenReturn(Optional.empty());
    Optional<Order> result = orderService.getOrderById(99L);
    assertThat(result).isEmpty();
}

// Exception scenario
@Test
void updateOrderStatus_invalidTransition_throwsException() {
    when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
    
    assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "INVALID"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Cannot transition");
}

// Verify repository interaction
@Test
void deleteOrder_callsRepository() {
    orderService.deleteOrder(1L);
    verify(orderRepository).deleteById(1L);
}
```

### Controller Layer

```java
// GET endpoint - success
@Test
void getOrderById_existingId_returnsOrder() throws Exception {
    when(orderService.getOrderById(1L)).thenReturn(Optional.of(order));
    
    mockMvc.perform(get("/api/orders/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.customerName").value("Jane"));
}

// GET endpoint - not found
@Test
void getOrderById_nonExistingId_returns404() throws Exception {
    when(orderService.getOrderById(99L)).thenReturn(Optional.empty());
    
    mockMvc.perform(get("/api/orders/99"))
        .andExpect(status().isNotFound());
}

// POST endpoint - success
@Test
void createOrder_validOrder_returns201() throws Exception {
    when(orderService.createOrder(any(Order.class))).thenReturn(order);
    
    mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(order)))
        .andExpect(status().isCreated());
}

// POST endpoint - validation error
@Test
void createOrder_missingFields_returns400() throws Exception {
    Order invalidOrder = new Order();
    
    mockMvc.perform(post("/api/orders")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(invalidOrder)))
        .andExpect(status().isBadRequest());
}
```

## Naming Pattern Examples

```java
// Pattern: methodName_scenario_expectedBehavior

getAllOrders_returnsAllOrders()
getOrderById_existingId_returnsOrder()
getOrderById_nonExistingId_returnsEmpty()
createOrder_setsDefaultStatus()
createOrder_validOrder_returns201()
createOrder_missingFields_returns400()
updateOrderStatus_validTransition_succeeds()
updateOrderStatus_invalidTransition_throwsException()
deleteOrder_callsRepository()