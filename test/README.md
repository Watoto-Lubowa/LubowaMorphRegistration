# Test Files

This folder contains test files for various functionalities of the Lubowa Morph Registration system.

## Test Files

### `autofocus-validation.html`
Tests the auto-focus functionality for form validation. This demonstrates:
- Single field validation with auto-focus
- Radio button validation with auto-focus  
- Multiple field validation with smart focusing
- Visual error highlighting with CSS animations

**Usage**: Open the file in a browser and use the test buttons to see how invalid fields are automatically focused and highlighted.

### `name-matching.html` 
Tests the enhanced name matching algorithm used in the fallback search. This demonstrates:
- Multiple names in different orders (e.g., "John Smith" vs "Smith John Peter")
- Single name matching within full names
- Partial matching and contains logic
- 17 predefined test cases covering various scenarios

**Usage**: Open the file in a browser to see all test cases run automatically. You can also test your own name combinations using the input fields.

### `storage-test.js`
JavaScript tests for Firebase Storage functionality and file upload/download operations.

### `rules-test.js`
JavaScript tests for Firebase Security Rules validation and access control.

## Running Tests

1. Open any test file in a web browser
2. The tests will run automatically or provide interactive buttons
3. Check the browser console for detailed logging and debug information

## Test Coverage

These tests cover:
- ✅ Form validation and auto-focus functionality
- ✅ Name matching algorithms for search fallback
- ✅ Firebase Storage operations and file handling
- ✅ Firebase Security Rules validation
- ✅ CSS animations and visual feedback
- ✅ Edge cases and error handling

## Dependencies

- CSS styles are loaded from `../styles.css` (parent directory)
- No external dependencies required
- Works in all modern browsers
