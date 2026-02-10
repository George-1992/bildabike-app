'use client';

import Validators from "@/utils/validation";
import { useState, useEffect } from "react";
import Select from "@/components/select";
import DateInput from "@/components/date";
import NotesArray from "@/components/other/notesArray";
import { Toggle } from "@/components/other/toggle";
import { cn } from "@/libs/utils";

/**
 * FormBuilder Component
 * 
 * A flexible form generation component that renders form fields based on a fields array configuration.
 * Supports validation, custom field types, and dynamic field dependencies.
 * 
 * @component
 * @example
 * const fields = [
 *   { name: 'email', label: 'Email', type: 'email', required: true }
 * ];
 * return <FormBuilder fields={fields} formData={data} onChange={handleChange} onSubmit={handleSubmit} />
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className=''] - Additional CSS classes for the form container
 * @param {string} [props.heightClassName=''] - CSS classes for height customization
 * @param {Array<FieldConfig>} [props.fields=[]] - Array of field configuration objects
 * @param {Object} [props.formData={}] - Current form data object with field values
 * @param {Function} [props.onChange=() => {}] - Callback fired when any field changes, receives updated formData
 * @param {Function} [props.onSubmit=() => {}] - Callback fired on form submission with validated formData
 * @param {Array<Array<string>>} [props.renderOrder=[]] - 2D array defining field layout per row
 * @param {boolean} [props.isForm=true] - If true, renders as HTML form element
 * @param {boolean} [props.isInlineEdit=false] - Enables inline edit mode
 * @param {boolean} [props.disabled=false] - Disables all form inputs
 * @param {string} [props.buttonClassName=''] - CSS classes for submit button
 * @param {Array<ReactNode>} [props.buttons=[]] - Additional button components to render
 * @param {boolean} [props.isLoading=false] - Shows loading state, disables inputs
 * @param {string} [props.submitButtonText='Save'] - Text for submit button
 * @param {boolean} [props.saveButtonTop=false] - If true, renders save button above form fields
 * @param {boolean} [props.isFixedButtons=false] - If true, fixes button section to bottom
 * @param {boolean} [props.isButtons=true] - If false, hides button section
 * @param {boolean} [props.scrollable=false] - If true, form body becomes scrollable
 * @param {Array<string>} [props.excludeKeys=[]] - Field names to exclude from submission
 * 
 * @typedef {Object} FieldConfig
 * @property {string} name - Unique field identifier
 * @property {string|React.ReactNode} label - Display label for field (string or React component)
 * @property {string} [type='text'] - Input type (text, email, number, select, textarea, date, datetime, toggle, notesArray, element)
 * @property {string} [placeholder=''] - Input placeholder text
 * @property {boolean} [required=false] - Makes field required for validation
 * @property {boolean} [disabled=false] - Disables individual field
 * @property {boolean} [hidden=false] - Hides field from rendering
 * @property {string} [className=''] - Custom CSS classes for field wrapper
 * @property {string} [validator] - Validator function key (from Validators object)
 * @property {Array<{value, label}>} [options] - Options for select fields
 * @property {Function} [getValue] - Custom function to get field value from formData
 * @property {Function} [setValue] - Custom function to set field value in formData
 * @property {Function} [func] - Function to compute dependent field values
 * @property {React.Component} [EditComponent] - Custom component to render instead of default input
 * @property {boolean} [multiple=false] - For select fields, enables multi-select
 * @property {boolean} [searchable=false] - For select fields, adds search functionality
 * @property {boolean} [clearable=false] - Adds clear button to input
 * @property {number} [rows=3] - Rows for textarea fields
 * @property {boolean} [showTime=false] - For date fields, includes time picker
 * @property {string} [format] - Date format string
 * @property {string} [minDate] - Minimum selectable date
 * @property {string} [maxDate] - Maximum selectable date
 * 
 * @returns {React.ReactElement} Form component
 */


export default function FormBuilder({
    className = '',
    heightClassName = '',
    fields = [],
    formData = {},
    onChange = () => { },
    onSubmit = () => { },
    renderOrder = [],
    isForm = true,
    isInlineEdit = false,
    disabled = false,
    buttonClassName = '',
    excludeKeys = [],
    buttons = [], //buttons components to render next to the Save button
    isLoading = false,
    submitButtonText = 'Save',
    saveButtonTop = false,

    isFixedButtons = false, //if true the buttons section will be fixed/absolute at the bottom of the form
    isButtons = true, //if false the buttons section will not be rendered
    scrollable = false, //if true the form body will be scrollable
}) {

    const [_formData, _setFormData] = useState(formData)
    const [_formErrors, _setFormErrors] = useState({})
    const [_isLoading, _setIsLoading] = useState(isLoading)
    const [_renderOrder, _setRenderOrder] = useState(renderOrder && renderOrder.length > 0
        ? renderOrder
        : fields.map(f => [f.name])
    )

    // console.log('_renderOrder: ', _renderOrder);


    // if field has getValue func call it to set initial value
    const handleGetValue = (field) => {
        try {
            let value = _formData[field.name];
            if (field.getValue && typeof field.getValue === 'function') {
                value = field.getValue(_formData);
            }
            return value;
        } catch (error) {
            console.error('FormBuilder handleGetValue error ==> ', error);
        }
    };
    const handlesSetValue = (currentFormData, name, value) => {
        let data = { ...currentFormData };
        const thisField = fields.find(f => f.name === name);

        if (thisField.setValue && typeof thisField.setValue === 'function') {
            const func = thisField.setValue;
            data = func(data, value);
            // console.log(' func(data, value): ', func(data, value));

        } else {
            data[name] = value;
        }

        return data;
    };
    //if any fields func is defined call it to update dependent fields
    const handleFieldsWithFunc = (data) => {
        fields.forEach(field => {
            if (
                (field.func && typeof field.func === 'function')
                || (field.setValue && typeof field.setValue === 'function')
            ) {
                const func = field.func || field.setValue;
                const newValue = func(data);
                // console.log('field: ',field);
                if (newValue !== undefined) {
                    data[field.name] = newValue;
                }
            }
        });
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // let av = value;
        // let newFormData = { ..._formData, [name]: av }

        const nfd = handlesSetValue(_formData, name, value);
        // console.log('newFormData: ', nfd);

        _setFormData(nfd);
        onChange(nfd);
    };

    const formSubmit = (e) => {
        try {
            // console.log('Form submit e==> ', e);
            // console.log('Form submit disabled==> ', disabled);

            e.preventDefault();
            if (disabled) return;

            // validate
            let hasErrors = false;
            const newErrors = {};

            // Check all fields, not just ones in formData
            for (const field of fields) {
                const key = field.name;
                const value = _formData[key];

                // Check if required field is empty
                if (field.required) {
                    const isEmpty = value === undefined || value === null || value === '' ||
                        (Array.isArray(value) && value.length === 0);

                    if (isEmpty) {
                        // console.log('isEmpty: ', isEmpty);

                        newErrors[key] = `${field.label || key} is required`;
                        hasErrors = true;
                        continue;
                    }
                }

                // Run validator if exists
                const v = Validators[field?.validator || field?.validateKey || key];
                if (v && !v(value).isValid) {
                    newErrors[key] = v(value).errors.join(', ');
                    hasErrors = true;
                }
            }
            // console.log('Form submit newErrors==> ', newErrors);

            if (hasErrors) {
                _setFormErrors(newErrors);
                return;
            }

            // Parse number fields before submitting
            const processedFormData = { ..._formData };
            for (const field of fields) {
                const key = field.name;
                const value = processedFormData[key];

                // Parse number fields
                if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
                    const numValue = parseFloat(value);
                    processedFormData[key] = isNaN(numValue) ? value : numValue;
                }
            }

            onSubmit(processedFormData);

        } catch (error) {
            console.error('FormBuilder formSubmit error ==> ', error);
        }
    }
    // console.log('Form submit _formErrors==> ', _formErrors);


    // if typing removes errors if any
    const str1 = Object.values(_formData).join(', ');
    useEffect(() => {
        if (Object.keys(_formErrors).length > 0) {
            _setFormErrors({});
        }
    }, [str1]);



    // update isLoading state if prop changes
    useEffect(() => {
        _setIsLoading(isLoading);
    }, [isLoading]);


    if (!fields) {
        return null;
    }
    // console.log('FormBuilder renderOrder ==> ', _renderOrder);
    // console.log('_formData: ', _formData);
    // console.log('_formData: ', _formData);
    // console.log('fields: ', fields);
    // console.log('saveButtonTop: ', saveButtonTop);
    // console.log('scrollable: ', scrollable);
    // console.log('className: ', className);



    return (
        <div className={cn(
            'formBuilder',
            className,
            heightClassName,
        )}>
            <form className={`w-full gap-3 flex flex-col ${className}`} onSubmit={formSubmit}>
                {fields && fields.length > 0 && isForm && saveButtonTop &&
                    <div className="flex items-center justify-end">
                        {
                            buttons && buttons.length > 0
                                ? buttons.map((ButtonComp, bIdx) => (
                                    <button key={`bIdx-level1-${bIdx}`} type="submit">
                                        {ButtonComp}
                                    </button>
                                ))
                                : <div className="flex items-center justify-end" type="submit">
                                    <button className={`btn btn-primary min-w-24 ${buttonClassName}`} disabled={_isLoading || disabled} type="submit">
                                        {submitButtonText}
                                    </button>
                                </div>
                        }
                    </div>
                }

                <div
                    className={cn(
                        "w-full flex flex-col gap-3 p-0.5",
                        heightClassName,
                        scrollable ? "overflow-y-auto px-0.5" : "overflow-hidden"
                    )}
                >
                    {
                        _renderOrder && _renderOrder.map((rowItems, idx) => {
                            const rowFields = fields.filter(f => (rowItems.includes(f.name) || rowItems.includes(f.key)) && !f.hidden);


                            // console.log('rowFields 1: ', {
                            //     rowItems,
                            // });
                            if (!rowFields || rowFields.length === 0) {
                                // console.log('lost fields: ', { rowItems, rowFields, fields });
                                return null
                            };


                            return (
                                <div key={idx} className="flex md:flex-row flex-col gap-4">
                                    {rowFields.map((field, fIdx) => {
                                        // console.log('field: ', field);

                                        if (field.type === 'element') {

                                            return (
                                                <field.Component
                                                    key={`fIdx-level1-${fIdx}`}
                                                    // formData={_formData}
                                                    // formErrors={_formErrors}
                                                    // onChange={handleInputChange}
                                                    isLoading={_isLoading}
                                                />
                                            );
                                        }

                                        return (
                                            <div key={`fIdx-level1-${fIdx}`} className={`form-group flex-1 relative flex flex-col justify-start ${field.className || ''}`}>
                                                <label
                                                    htmlFor={field.name}
                                                    className={cn(
                                                        _formErrors[field.name] ? 'text-red-500' : '',
                                                    )}
                                                >
                                                    {field.label}
                                                </label>

                                                <div className="flex-1 h-full flex flex-col items-start justify-center">
                                                    {field.EditComponent
                                                        ? <field.EditComponent
                                                            value={handleGetValue(field)}
                                                            row={_formData}
                                                            onChange={handleInputChange}
                                                        />
                                                        : <div className="w-full h-full relative rounded-md">
                                                            {field.type === 'select'
                                                                ? (
                                                                    <Select
                                                                        id={field.name}
                                                                        name={field.name}
                                                                        value={handleGetValue(field) || (field.multiple ? [] : '')}
                                                                        onChange={handleInputChange}
                                                                        options={field.options || []}
                                                                        placeholder={field.placeholder}
                                                                        searchable={field.searchable || false}
                                                                        clearable={field.clearable || false}
                                                                        multiple={field.multiple || false}
                                                                        disabled={_isLoading || field.disabled}
                                                                        required={field.required}
                                                                        error={_formErrors[field.name]}
                                                                        renderOption={field.renderOption}
                                                                        renderValue={field.renderValue}
                                                                        loading={field.loading || false}
                                                                        loadingText={field.loadingText}
                                                                        noOptionsText={field.noOptionsText}
                                                                    // className={`${field.className || ''}`}
                                                                    />
                                                                )
                                                                : field.type === 'toggle'
                                                                    ? (
                                                                        <Toggle
                                                                            checked={!!handleGetValue(field)}
                                                                            onChange={(v) => {
                                                                                const newFormData = handlesSetValue(_formData, field.name, v);
                                                                                _setFormData(newFormData);
                                                                                onChange(newFormData);
                                                                            }}
                                                                            disabled={_isLoading || field.disabled}
                                                                        />
                                                                    )
                                                                    : field.type === 'date' || field.type === 'datetime'
                                                                        ? (
                                                                            <DateInput
                                                                                id={field.name}
                                                                                name={field.name}
                                                                                value={handleGetValue(field) || ''}
                                                                                onChange={handleInputChange}
                                                                                placeholder={field.placeholder}
                                                                                disabled={_isLoading || field.disabled}
                                                                                required={field.required}
                                                                                error={_formErrors[field.name]}
                                                                                showTime={field.type === 'datetime' || field.showTime}
                                                                                format={field.format}
                                                                                clearable={field.clearable !== false}
                                                                                minDate={field.minDate}
                                                                                maxDate={field.maxDate}
                                                                                className={`w-full ${_formErrors[field.name] ? 'border-red-400' : ''} `}
                                                                            />
                                                                        )
                                                                        : field.type === 'textarea'
                                                                            ? (
                                                                                <textarea
                                                                                    id={field.name}
                                                                                    name={field.name}
                                                                                    placeholder={field.placeholder}
                                                                                    className={`form-control h-full ${_formErrors[field.name] ? 'border-red-400' : ''} ${field.disabled && 'cursor-not-allowed'}`}
                                                                                    required={field.required}
                                                                                    onChange={handleInputChange}
                                                                                    disabled={_isLoading || field.disabled}
                                                                                    value={handleGetValue(field) || ''}
                                                                                    rows={field.rows || 3}
                                                                                />
                                                                            )
                                                                            : (
                                                                                <input
                                                                                    id={field.name}
                                                                                    name={field.name}
                                                                                    type={field.type}
                                                                                    placeholder={field.placeholder}
                                                                                    className={`form-control ${_formErrors[field.name] ? 'border-red-400' : ''} ${field.disabled && 'cursor-not-allowed'} ${field.className || ''}`}
                                                                                    required={field.required}
                                                                                    onChange={handleInputChange}
                                                                                    disabled={_isLoading || field.disabled}
                                                                                    value={handleGetValue(field) || ''}
                                                                                    autoComplete={field.autoComplete || ''}
                                                                                />
                                                                            )}
                                                            {_isLoading && <div className="animate-shimmer" />}


                                                        </div>
                                                    }


                                                    {_formErrors[field.name] && !['select', 'date', 'datetime', 'notesArray'].includes(field.type) && (
                                                        <p className="text-sm text-red-500 my-1 expanding">
                                                            {_formErrors[field.name]}
                                                        </p>
                                                    )}

                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            );
                        })
                    }
                    {scrollable &&
                        <div className='h-12 w-full flex-shrink-0'></div>
                    }
                </div>
                {isButtons && fields && fields.length > 0 && isForm && !saveButtonTop &&
                    <div
                        className={cn(
                            isFixedButtons && 'fixed-buttons',
                            'flex items-center justify-end',
                        )}
                    >
                        {
                            buttons && buttons.length > 0
                                ? buttons.map((ButtonComp, bIdx) => (
                                    <button key={`bIdx-level1-${bIdx}`} type="submit">
                                        {ButtonComp}
                                    </button>
                                ))
                                : <div className="flex items-center justify-end" type="submit">
                                    <button className={`btn btn-primary min-w-24 ${buttonClassName}`} disabled={_isLoading || disabled} type="submit">
                                        {submitButtonText}
                                    </button>
                                </div>
                        }
                    </div>
                }

            </form>


            {/* <ModalButtonsContainer className="flex items-center justify-end">
                {
                    buttons && buttons.length > 0
                        ? buttons.map((ButtonComp, bIdx) => (
                            <button key={`bIdx-level1-${bIdx}`} type="submit">
                                {ButtonComp}
                            </button>
                        ))
                        : <div className="flex items-center justify-end" type="submit">
                            <button className={`btn btn-primary min-w-24 ${buttonClassName}`} disabled={_isLoading || disabled} type="submit">
                                {submitButtonText}
                            </button>
                        </div>
                }
            </ModalButtonsContainer> */}
            {/* <div className="w-full h-10 bg-red-300 "></div> */}
        </div>
    );
}


export const FormItem = ({
    type, componentType = 'input',
    value, onChange, label, placeholder, required = false, disabled = false
}) => {


    return (
        <div className="form-group flex-1 relative flex flex-col">
            <label htmlFor={label}>{label}</label>
            {componentType === 'input' && (
                <input
                    id={label}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className="form-control"
                />
            )}
        </div>
    );
};