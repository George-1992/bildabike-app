// Email validation
export const validateEmail = (email) => {
    const errors = [];

    if (!email || email.trim() === '') {
        errors.push('Email is required');
        return { isValid: false, errors };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
    }

    if (email.length > 254) {
        errors.push('Email must be less than 254 characters');
    }

    return { isValid: errors.length === 0, errors };
};

// Password validation
export const validatePassword = (password, options = {}) => {
    const {
        minLength = 8,
        requireUppercase = false,
        requireLowercase = false,
        requireNumbers = false,
        requireSpecialChars = false,
        maxLength = 128
    } = options;

    const errors = [];

    if (!password) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
        errors.push(`Password must be less than ${maxLength} characters`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return { isValid: errors.length === 0, errors };
};

// Name validation
export const validateName = (name, fieldName = 'Name', options = {}) => {
    const { minLength = 1, maxLength = 50, allowNumbers = false } = options;
    const errors = [];

    if (!name || name.trim() === '') {
        errors.push(`${fieldName} is required`);
        return { isValid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < minLength) {
        errors.push(`${fieldName} must be at least ${minLength} character${minLength > 1 ? 's' : ''} long`);
    }

    if (trimmedName.length > maxLength) {
        errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = allowNumbers
        ? /^[a-zA-Z0-9\s\-'\.]+$/
        : /^[a-zA-Z\s\-'\.]+$/;

    if (!nameRegex.test(trimmedName)) {
        errors.push(`${fieldName} contains invalid characters`);
    }

    // Check for consecutive spaces or special characters
    if (/\s{2,}/.test(trimmedName)) {
        errors.push(`${fieldName} cannot contain consecutive spaces`);
    }

    return { isValid: errors.length === 0, errors, value: trimmedName };
};

// Phone number validation
export const validatePhone = (phone, options = {}) => {
    const { required = false, format = 'international' } = options;
    const errors = [];

    if (!phone || phone.trim() === '') {
        if (required) {
            errors.push('Phone number is required');
        }
        return { isValid: !required, errors };
    }

    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');

    if (format === 'us' && (!/^1?[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(cleanPhone) || cleanPhone.length < 10)) {
        errors.push('Please enter a valid US phone number');
    } else if (format === 'international' && (cleanPhone.length < 7 || cleanPhone.length > 15)) {
        errors.push('Please enter a valid phone number');
    }

    return { isValid: errors.length === 0, errors };
};

// URL validation
export const validateUrl = (url, options = {}) => {
    const { required = false, allowedProtocols = ['http', 'https'] } = options;
    const errors = [];

    if (!url || url.trim() === '') {
        if (required) {
            errors.push('URL is required');
        }
        return { isValid: !required, errors };
    }

    try {
        const urlObj = new URL(url);
        if (!allowedProtocols.includes(urlObj.protocol.slice(0, -1))) {
            errors.push(`URL must use one of these protocols: ${allowedProtocols.join(', ')}`);
        }
    } catch {
        errors.push('Please enter a valid URL');
    }

    return { isValid: errors.length === 0, errors };
};

// Generic required field validation
export const validateRequired = (value, fieldName = 'Field') => {
    const errors = [];

    if (value === null || value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)) {
        errors.push(`${fieldName} is required`);
    }

    return { isValid: errors.length === 0, errors };
};

// String length validation
export const validateLength = (value, fieldName = 'Field', options = {}) => {
    const { min = 0, max = Infinity } = options;
    const errors = [];

    if (!value) {
        return { isValid: true, errors }; // Let required validation handle empty values
    }

    const length = typeof value === 'string' ? value.trim().length : value.toString().length;

    if (length < min) {
        errors.push(`${fieldName} must be at least ${min} character${min > 1 ? 's' : ''} long`);
    }

    if (length > max) {
        errors.push(`${fieldName} must be less than ${max} characters`);
    }

    return { isValid: errors.length === 0, errors };
};

// Number validation
export const validateNumber = (value, fieldName = 'Number', options = {}) => {
    const { min = -Infinity, max = Infinity, integer = false } = options;
    const errors = [];

    if (value === null || value === undefined || value === '') {
        return { isValid: true, errors }; // Let required validation handle empty values
    }

    const num = Number(value);

    if (isNaN(num)) {
        errors.push(`${fieldName} must be a valid number`);
        return { isValid: false, errors };
    }

    if (integer && !Number.isInteger(num)) {
        errors.push(`${fieldName} must be a whole number`);
    }

    if (num < min) {
        errors.push(`${fieldName} must be at least ${min}`);
    }

    if (num > max) {
        errors.push(`${fieldName} must be no more than ${max}`);
    }

    return { isValid: errors.length === 0, errors };
};

// Date validation
export const validateDate = (date, fieldName = 'Date', options = {}) => {
    const { minDate, maxDate, format = 'YYYY-MM-DD' } = options;
    const errors = [];

    if (!date) {
        return { isValid: true, errors }; // Let required validation handle empty values
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
        return { isValid: false, errors };
    }

    if (minDate && dateObj < new Date(minDate)) {
        errors.push(`${fieldName} must be after ${minDate}`);
    }

    if (maxDate && dateObj > new Date(maxDate)) {
        errors.push(`${fieldName} must be before ${maxDate}`);
    }

    return { isValid: errors.length === 0, errors };
};

// Multiple field validation helper
export const validateFields = (data, validationRules) => {
    const results = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(validationRules)) {
        const fieldValue = data[fieldName];
        const fieldResults = { isValid: true, errors: [] };

        for (const rule of rules) {
            const result = rule.validator(fieldValue, rule.options);
            if (!result.isValid) {
                fieldResults.isValid = false;
                fieldResults.errors.push(...result.errors);
                isValid = false;
            }
        }

        results[fieldName] = fieldResults;
    }

    return { isValid, results };
};

// Common validation rule sets
export const commonRules = {
    email: [
        { validator: validateRequired, options: {} },
        { validator: validateEmail, options: {} }
    ],
    password: [
        { validator: validateRequired, options: {} },
        { validator: validatePassword, options: { minLength: 8 } }
    ],
    name: [
        { validator: validateRequired, options: {} },
        { validator: (value) => validateName(value, 'Name', { maxLength: 50 }), options: {} }
    ],
    phone: [
        { validator: (value) => validatePhone(value, { required: false }), options: {} }
    ],
    url: [
        { validator: (value) => validateUrl(value, { required: false }), options: {} }
    ]
};

const Validators = {
    email: validateEmail,
    password: validatePassword,
    name: validateName,
    phone: validatePhone,
    url: validateUrl,
    required: validateRequired,
    length: validateLength,
    number: validateNumber,
    date: validateDate,
    fields: validateFields,
}

export default Validators;