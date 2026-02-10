'use client';

import { useEffect, useState } from 'react';

export default function FormEl({ initialValues, validate, onSubmit, children }) {
    const [_values, _setValues] = useState(initialValues || {});
    const [_errors, _setErrors] = useState({});

    useEffect(() => {
        _setValues(initialValues || {});
        _setErrors({});
    }, [initialValues]);

    const setFieldValue = (field, value) => {
        _setValues(prev => ({ ...prev, [field]: value }));
        if (_errors[field]) {
            _setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async () => {
        const nextErrors = validate ? validate(_values) : {};
        if (nextErrors && Object.keys(nextErrors).length > 0) {
            _setErrors(nextErrors);
            return;
        }

        if (onSubmit) {
            await onSubmit(_values);
        }
    };

    return children({
        values: _values,
        errors: _errors,
        setFieldValue,
        handleSubmit,
        setValues: _setValues,
        setErrors: _setErrors,
    });
}
