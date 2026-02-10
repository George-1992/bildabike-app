# DateInput Component

# DateInput Component (React DatePicker)

A clean, reliable date picker component built with react-datepicker that integrates seamlessly with your existing form system and design.

## Features

- ✅ Single date selection with calendar popup
- ✅ Date and time selection with time picker
- ✅ Multiple date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
- ✅ Date range constraints (min/max dates)
- ✅ Clearable selections
- ✅ Error states and validation
- ✅ Keyboard accessibility (Arrow keys, Enter, Escape)
- ✅ Click-outside-to-close behavior
- ✅ Smooth animations and transitions
- ✅ Disabled state support
- ✅ Inline mode for table editing
- ✅ Integration with FormBuilder and Table components

## Basic Usage

```jsx
import DateInput from '@/components/date';

function MyComponent() {
  const [date, setDate] = useState('');
  
  return (
    <DateInput
      value={date}
      onChange={(e) => setDate(e.target.value)}
      placeholder="Select a date..."
    />
  );
}
```

## Advanced Usage

### Date with Time
```jsx
<DateInput
  value={dateTime}
  onChange={(e) => setDateTime(e.target.value)}
  placeholder="Select date and time..."
  showTime={true}
  format="YYYY-MM-DD HH:mm"
/>
```

### Custom Format
```jsx
<DateInput
  value={date}
  onChange={(e) => setDate(e.target.value)}
  format="MM/DD/YYYY"
  placeholder="MM/DD/YYYY"
/>
```

### Date Range Constraints
```jsx
const today = new Date().toISOString().split('T')[0];
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

<DateInput
  value={date}
  onChange={(e) => setDate(e.target.value)}
  minDate={today}
  maxDate={nextMonth}
  placeholder="Select within range..."
/>
```

### Inline Mode (for Table Editing)
```jsx
<DateInput
  value={date}
  onChange={(e) => setDate(e.target.value)}
  inline={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | Selected date value (ISO 8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ) |
| `onChange` | `function` | `() => {}` | Change handler function |
| `placeholder` | `string` | `'Select date...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |
| `required` | `boolean` | `false` | Mark as required field |
| `error` | `string` | `''` | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |
| `name` | `string` | `''` | Input name for forms |
| `id` | `string` | `''` | Input ID |
| `showTime` | `boolean` | `false` | Enable time selection |
| `format` | `string` | `'YYYY-MM-DD'` | Date format string |
| `clearable` | `boolean` | `true` | Show clear button |
| `minDate` | `string \| Date` | `null` | Minimum selectable date |
| `maxDate` | `string \| Date` | `null` | Maximum selectable date |
| `inline` | `boolean` | `false` | Inline mode for table editing |

## Supported Formats

- `YYYY-MM-DD` - ISO format (default)
- `MM/DD/YYYY` - US format
- `DD/MM/YYYY` - European format  
- `YYYY-MM-DD HH:mm` - ISO with time
- `MM/DD/YYYY HH:mm` - US format with 12-hour time

## Integration with FormBuilder

The DateInput component integrates seamlessly with your existing FormBuilder:

```jsx
<FormBuilder
  fields={[
    {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
      placeholder: 'Select due date...',
      required: true,
      clearable: true
    },
    {
      name: 'created_at',
      label: 'Created At',
      type: 'datetime',
      showTime: true,
      format: 'YYYY-MM-DD HH:mm',
      placeholder: 'Select date and time...'
    },
    {
      name: 'event_date',
      label: 'Event Date',
      type: 'date',
      format: 'MM/DD/YYYY',
      minDate: '2024-01-01',
      maxDate: '2024-12-31'
    }
  ]}
  formData={formData}
  onChange={setFormData}
/>
```

## Integration with Table Component

Works seamlessly with your Table component for inline editing:

```jsx
<Table
  columns={[
    {
      key: 'due_date',
      title: 'Due Date',
      type: 'date',
      required: true,
      clearable: true,
      placeholder: 'Select due date...'
    },
    {
      key: 'created_at',
      title: 'Created At',
      type: 'datetime',
      showTime: true,
      format: 'YYYY-MM-DD HH:mm'
    }
  ]}
  data={tableData}
  editable={true}
  editableInline={true}
/>
```

## Time Picker Features

When `showTime={true}`:
- 12-hour format with AM/PM selection
- Hour selection (1-12)
- Minute selection (00-59)
- Automatic time zone handling
- Time validation and constraints

## Calendar Features

- Month/year navigation with arrow buttons
- Current day highlighting
- Selected date highlighting
- Disabled dates (outside min/max range)
- Weekend highlighting (optional)
- Multi-month view (optional)

## Keyboard Navigation

- **Arrow Keys**: Navigate through calendar dates
- **Enter**: Select highlighted date or open calendar
- **Escape**: Close calendar
- **Tab**: Navigate between time picker elements
- **Space**: Open calendar (when focused)

## Accessibility Features

- Full ARIA support (`aria-expanded`, `aria-haspopup`, `aria-selected`)
- Keyboard navigation
- Screen reader announcements
- Focus management
- High contrast support
- RTL (Right-to-Left) language support

## Styling and Theming

The component uses your existing design system:
- CSS custom properties for consistent theming
- Tailwind CSS classes matching your design patterns
- `.form-control` styling consistency
- Smooth animations with your existing animation classes
- Error states matching your form validation styles

## Error Handling and Validation

- Invalid date format detection
- Date range validation (min/max)
- Required field validation
- Custom error message display
- Form submission validation

## Browser Support

- Modern browsers with ES6+ support
- Mobile touch support
- Responsive design for all screen sizes
- Progressive enhancement for older browsers

## Performance

- Lightweight bundle size
- Lazy calendar rendering
- Efficient re-rendering with React hooks
- Memory leak prevention
- Optimized for large datasets in tables

## Examples

See `components/date/examples.jsx` for comprehensive usage examples including:
- Basic date selection
- Date with time picker
- Custom formats
- Date range constraints
- Error states
- Disabled states
- Inline table editing mode

## ISO 8601 Format

The component automatically handles ISO 8601 date/time formats:

- **Date Only**: `2024-10-08` (YYYY-MM-DD)
- **Date with Time**: `2024-10-08T14:30:00.000Z` (full ISO 8601 with timezone)

### Benefits:
- **Standardized** - Universal date format
- **Sortable** - Lexicographic sorting works correctly
- **Database Friendly** - Most databases prefer ISO format
- **API Compatible** - Standard for REST APIs and JSON
- **Timezone Aware** - When using showTime=true

```jsx
// Date only (ISO 8601: 2024-10-08)
<DateInput
  value="2024-10-08"
  onChange={(e) => console.log(e.target.value)} // "2024-10-08"
/>

// Date with time (ISO 8601: 2024-10-08T14:30:00.000Z)
<DateInput
  value="2024-10-08T14:30:00.000Z"
  showTime={true}
  onChange={(e) => console.log(e.target.value)} // "2024-10-08T14:30:00.000Z"
/>
```

## Migration from Basic HTML Date Input

```jsx
// Before
<input type="date" value={date} onChange={handleChange} />

// After
<DateInput 
  value={date} 
  onChange={handleChange}
/>
```

The DateInput component provides a rich, accessible date selection experience while maintaining compatibility with your existing forms and data handling.