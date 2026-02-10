# Select Component

A comprehensive, accessible select component built for React with full TypeScript support and seamless integration with your existing form system.

## Features

- ✅ Single and multiple selection
- ✅ Searchable options with keyboard navigation
- ✅ Custom option and value rendering
- ✅ Clearable selections
- ✅ Loading states
- ✅ Error states and validation
- ✅ Keyboard accessibility (Arrow keys, Enter, Escape)
- ✅ Click-outside-to-close behavior
- ✅ Smooth animations and transitions
- ✅ Disabled state support
- ✅ Custom styling and theming
- ✅ Integration with FormBuilder

## Basic Usage

```jsx
import Select from '@/components/select';

function MyComponent() {
  const [value, setValue] = useState('');
  
  const options = [
    'Option 1',
    'Option 2', 
    'Option 3'
  ];

  return (
    <Select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      options={options}
      placeholder="Select an option..."
    />
  );
}
```

## Advanced Usage

### Object Options
```jsx
const options = [
  { value: 'admin', label: 'Administrator', disabled: false },
  { value: 'user', label: 'User', disabled: false },
  { value: 'guest', label: 'Guest', disabled: true }
];

<Select
  value={selectedRole}
  onChange={(e) => setSelectedRole(e.target.value)}
  options={options}
  placeholder="Select a role..."
  searchable={true}
  clearable={true}
/>
```

### Multiple Selection
```jsx
<Select
  value={selectedItems}
  onChange={(e) => setSelectedItems(e.target.value)}
  options={options}
  placeholder="Select multiple items..."
  multiple={true}
  searchable={true}
  clearable={true}
/>
```

### Custom Rendering
```jsx
const renderUserOption = (option) => (
  <div className="flex items-center gap-2">
    <img src={option.avatar} className="w-6 h-6 rounded-full" />
    <div>
      <div className="font-medium">{option.label}</div>
      <div className="text-sm text-gray-500">{option.email}</div>
    </div>
  </div>
);

const renderUserValue = (option) => (
  <div className="flex items-center gap-2">
    <img src={option.avatar} className="w-4 h-4 rounded-full" />
    <span>{option.label}</span>
  </div>
);

<Select
  value={selectedUser}
  onChange={(e) => setSelectedUser(e.target.value)}
  options={userOptions}
  renderOption={renderUserOption}
  renderValue={renderUserValue}
  searchable={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| string[]` | `''` | Selected value(s) |
| `onChange` | `function` | `() => {}` | Change handler function |
| `options` | `Array<string \| {value, label, disabled}>` | `[]` | Options array |
| `placeholder` | `string` | `'Select an option...'` | Placeholder text |
| `searchable` | `boolean` | `false` | Enable search functionality |
| `clearable` | `boolean` | `false` | Show clear button |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Mark as required field |
| `error` | `string` | `''` | Error message to display |
| `className` | `string` | `''` | Additional CSS classes |
| `dropdownClassName` | `string` | `''` | CSS classes for dropdown |
| `multiple` | `boolean` | `false` | Enable multiple selection |
| `maxHeight` | `string` | `'200px'` | Maximum height of dropdown |
| `renderOption` | `function` | `null` | Custom option renderer |
| `renderValue` | `function` | `null` | Custom value renderer |
| `loading` | `boolean` | `false` | Show loading state |
| `loadingText` | `string` | `'Loading...'` | Loading message |
| `noOptionsText` | `string` | `'No options found'` | No options message |
| `name` | `string` | `''` | Input name for forms |
| `id` | `string` | `''` | Input ID |

## Integration with FormBuilder

The Select component integrates seamlessly with your existing FormBuilder:

```jsx
<FormBuilder
  fields={[
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      placeholder: 'Select a role...',
      required: true,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'User' },
        { value: 'guest', label: 'Guest' }
      ],
      searchable: true,
      clearable: true
    },
    {
      name: 'skills',
      label: 'Skills',
      type: 'select',
      multiple: true,
      options: ['JavaScript', 'React', 'Node.js', 'Python'],
      searchable: true,
      clearable: true
    }
  ]}
  formData={formData}
  onChange={setFormData}
/>
```

## Keyboard Navigation

- **Arrow Down/Up**: Navigate through options
- **Enter**: Select highlighted option or open dropdown
- **Escape**: Close dropdown
- **Space**: Open dropdown (when not searchable)
- **Type to search**: When searchable is enabled

## Styling

The component uses your existing design system with:
- CSS custom properties for theming
- Tailwind CSS classes
- Consistent with `.form-control` styling
- Smooth animations matching your design patterns

## Accessibility

- Proper ARIA attributes (`role`, `aria-expanded`, `aria-haspopup`, `aria-selected`)
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Examples

See `components/select/examples.jsx` for comprehensive usage examples including:
- Basic select
- Searchable select
- Multiple selection
- Custom rendering
- Error states
- Loading states
- Disabled states