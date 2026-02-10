import Select from './index';

// Example usage of the Select component

export const SelectExamples = () => {
    const [selectedValue, setSelectedValue] = useState('');
    const [multipleValues, setMultipleValues] = useState([]);
    const [searchableValue, setSearchableValue] = useState('');

    // Simple string options
    const simpleOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

    // Object options with {value, label} format
    const complexOptions = [
        { value: 'user1', label: 'John Doe', disabled: false },
        { value: 'user2', label: 'Jane Smith', disabled: false },
        { value: 'user3', label: 'Bob Johnson', disabled: true },
        { value: 'user4', label: 'Alice Brown', disabled: false },
        { value: 'user5', label: 'Charlie Wilson', disabled: false },
    ];

    // Additional examples of {value, label} options
    const roleOptions = [
        { value: 'admin', label: 'Administrator' },
        { value: 'manager', label: 'Manager' },
        { value: 'employee', label: 'Employee' },
        { value: 'contractor', label: 'Contractor' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending Approval' },
        { value: 'suspended', label: 'Suspended' },
    ];

    // Custom render functions
    const renderUserOption = (option) => (
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span>{option.label}</span>
        </div>
    );

    const renderUserValue = (option) => (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
            <span>{option.label}</span>
        </div>
    );

    return (
        <div className="space-y-6 p-6">
            {/* Basic Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Basic Select</label>
                <Select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    options={simpleOptions}
                    placeholder="Choose an option..."
                    name="basicSelect"
                />
            </div>

            {/* Searchable Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Searchable Select</label>
                <Select
                    value={searchableValue}
                    onChange={(e) => setSearchableValue(e.target.value)}
                    options={complexOptions}
                    placeholder="Search for a user..."
                    searchable={true}
                    clearable={true}
                    name="searchableSelect"
                />
            </div>

            {/* Multiple Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Multiple Select</label>
                <Select
                    value={multipleValues}
                    onChange={(e) => setMultipleValues(e.target.value)}
                    options={complexOptions}
                    placeholder="Select multiple users..."
                    multiple={true}
                    searchable={true}
                    clearable={true}
                    name="multipleSelect"
                />
            </div>

            {/* Custom Render Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Custom Render Select</label>
                <Select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    options={complexOptions}
                    placeholder="Select a user..."
                    renderOption={renderUserOption}
                    renderValue={renderUserValue}
                    searchable={true}
                    clearable={true}
                    name="customSelect"
                />
            </div>

            {/* Disabled Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Disabled Select</label>
                <Select
                    value="user2"
                    onChange={() => {}}
                    options={complexOptions}
                    placeholder="This is disabled"
                    disabled={true}
                    name="disabledSelect"
                />
            </div>

            {/* Error State Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Error State Select</label>
                <Select
                    value=""
                    onChange={(e) => setSelectedValue(e.target.value)}
                    options={simpleOptions}
                    placeholder="This has an error..."
                    error="This field is required"
                    required={true}
                    name="errorSelect"
                />
            </div>

            {/* Loading State Select */}
            <div>
                <label className="block text-sm font-medium mb-2">Loading State Select</label>
                <Select
                    value=""
                    onChange={() => {}}
                    options={[]}
                    placeholder="Loading..."
                    loading={true}
                    loadingText="Loading options..."
                    name="loadingSelect"
                />
            </div>

            {/* Role Select with {value, label} format */}
            <div>
                <label className="block text-sm font-medium mb-2">Role Select ({`{value, label}`} format)</label>
                <Select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    options={roleOptions}
                    placeholder="Select a role..."
                    searchable={true}
                    clearable={true}
                    name="roleSelect"
                />
            </div>

            {/* Status Select with {value, label} format */}
            <div>
                <label className="block text-sm font-medium mb-2">Status Select ({`{value, label}`} format)</label>
                <Select
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    options={statusOptions}
                    placeholder="Select status..."
                    clearable={true}
                    name="statusSelect"
                />
            </div>
        </div>
    );
};

export default SelectExamples;