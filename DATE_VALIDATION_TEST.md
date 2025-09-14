# Date Validation Test Cases

## Test the AI Search Date Range Validation

### Test Cases to Verify:

1. **Valid Date Range**
   - From: January 2020
   - To: December 2025
   - Expected: No error, search button enabled

2. **Invalid Date Range - Same Year**
   - From: December 2024
   - To: January 2024
   - Expected: Error message "End date cannot be earlier than start date", search button disabled

3. **Invalid Date Range - Different Years**
   - From: January 2025
   - To: December 2024
   - Expected: Error message "End date cannot be earlier than start date", search button disabled

4. **Edge Case - Same Month/Year**
   - From: June 2024
   - To: June 2024
   - Expected: No error (same date is valid), search button enabled

5. **Edge Case - Consecutive Months**
   - From: December 2024
   - To: January 2025
   - Expected: No error, search button enabled

### How to Test:

1. Open the AI Search page
2. Click on "Advanced Settings" to expand the options
3. Try different combinations of From/To dates
4. Observe:
   - Red error message appears when To date is earlier than From date
   - Search button becomes disabled when there's a validation error
   - Error disappears when you fix the date range
   - Search button becomes enabled again when date range is valid

### Expected Behavior:

- **Real-time validation**: Error appears immediately when you select an invalid date combination
- **Visual feedback**: Red error box with warning icon
- **Button state**: Search button disabled when validation fails
- **Auto-clear**: Error automatically clears when date range becomes valid
- **Form submission**: Cannot submit search with invalid date range
