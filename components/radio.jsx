'use client';

import { useEffect, useState } from "react";


export const InputEl = (props) => {



    return (
        <input {...props}
            className={`form-control ${props.className || ''}`}
        />
    );
}

export const TextareaEl = (props) => {

    return (
        <textarea {...props}
            className={`form-control ${props.className || ''}`}
        />
    );
};

export const FormEl = ({ initialValues, validate, onSubmit, children }) => { }