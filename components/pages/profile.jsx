'use client';
import { saUpdateItem, saUpdatePassword } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { User } from "lucide-react";
import { useState, useEffect } from "react";
import Validators from "@/utils/validation";


export default function Profile({ params, pathname, searchParams, session, user, account }) {



    const allFields = [
        {
            name: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name',
            type: 'text',
            required: true,
            hidden: false,
        },
        {
            name: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            type: 'text',
            required: true,
            hidden: false,
        },
        {
            name: 'email',
            label: 'Email',
            placeholder: 'Enter your email',
            type: 'email',
            required: true,
            hidden: false,
        },
        // {
        //     name: 'password',
        //     label: 'Password',
        //     placeholder: 'Enter your password',
        //     type: 'password',
        //     required: true,
        //     hidden: false,
        // }
    ]

    const fields = allFields

    const renderOrder = [
        ['firstName', 'lastName'],
        ['email'],
        ['password']
    ];

    // for new password
    const passwordFields = [
        {
            name: 'currentPassword',
            label: 'Current Password',
            placeholder: 'Enter your current password',
            type: 'password',
            required: true,
            hidden: false,
        },
        {
            name: 'newPassword',
            label: 'New Password',
            placeholder: 'Enter your new password',
            type: 'password',
            required: true,
            hidden: false,
        },
        {
            name: 'confirmNewPassword',
            label: 'Confirm New Password',
            placeholder: 'Enter your confirm new password',
            type: 'password',
            required: true,
            hidden: false,
        }
    ]
    const passwordRenderOrder = [
        ['currentPassword'],
        ['newPassword'],
        ['confirmNewPassword'],
    ];

    const [formData, setFormData] = useState({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        password: ''
    });
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const minLoadingTime = 500;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    const handleInputChange2 = (e) => {
        const { name, value } = e.target;
        setPasswordFormData(prev => ({ ...prev, [name]: value }));
    }



    const handleFirstForm = async (e) => {
        try {
            e.preventDefault();
            // console.log('Form submitted with data: ', formData);
            // compare to session if its the same then dont update
            if (formData.firstName === session?.first_name &&
                formData.lastName === session?.last_name &&
                formData.email === session?.email
            ) {
                notify({
                    type: 'warning',
                    message: 'No changes detected',
                })
                return;
            }

            const startTimestamp = Date.now();
            setIsLoading(true);


            const resObj = await saUpdateItem({
                collection: 'users',
                query: {
                    where: {
                        id: user?.id
                    },
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        email: formData.email
                    }
                }
            })

            const endTimestamp = Date.now();
            const elapsed = endTimestamp - startTimestamp;
            if (elapsed < minLoadingTime) {
                await new Promise(res => setTimeout(res, minLoadingTime - elapsed));
            }
            setIsLoading(false);

            // console.log('resObj ==> ', resObj);
            if (resObj.success) {
                notify({
                    type: 'success',
                    message: 'Profile updated successfully',
                })
            } else {
                notify({
                    type: 'error',
                    message: resObj.message || 'Error updating profile',
                })
            }


        } catch (error) {
            setIsLoading(false);
            console.error('Error in handleFirstForm: ', error);
        }
    }

    const handleFirstForm2 = async (e) => {
        try {
            e.preventDefault();
            if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
                setFormErrors({ confirmNewPassword: 'New passwords do not match' });
                return;
            }
            if (passwordFormData.newPassword.length < 6) {
                setFormErrors({ newPassword: 'New password must be at least 6 characters' });
                return;
            }
            if (passwordFormData.currentPassword.length < 6) {
                setFormErrors({ currentPassword: 'Current password must be at least 6 characters' });
                return;
            }


            // validate new password
            for (const key of Object.keys(passwordFormData)) {
                const ch = Validators.password(passwordFormData[key]);
                if (!ch.isValid) {
                    setFormErrors(prev => ({ ...prev, [key]: ch.errors.join(', ') }));
                    return;
                }
            }


            setIsLoading(true);
            const startTimestamp = Date.now();


            // call server action to update password
            const resObj = await saUpdatePassword({
                userId: user?.id,
                data: {
                    currentPassword: passwordFormData.currentPassword,
                    newPassword: passwordFormData.newPassword,
                }
            })
            console.log('resObj ==> ', resObj);


            const endTimestamp = Date.now();
            const elapsed = endTimestamp - startTimestamp;
            if (elapsed < minLoadingTime) {
                await new Promise(res => setTimeout(res, minLoadingTime - elapsed));
            }
            setIsLoading(false);
            if (resObj.success) {
                notify({
                    type: 'success',
                    message: 'Password updated successfully',
                })
                setPasswordFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                })
            } else {
                notify({
                    type: 'error',
                    message: resObj.message || 'Error updating password',
                })
            }

        } catch (error) {
            setIsLoading(false);
            console.error('Error in handleFirstForm: ', error);
        }
    }


    // if typing removes errors if any
    const str1 = Object.values(formData).join(', ');
    const str2 = Object.values(passwordFormData).join(', ');
    useEffect(() => {
        if (Object.keys(formErrors).length > 0) {
            setFormErrors({});
        }
    }, [str1, str2]);

    return (
        <div className="container-main flex flex-col gap-6">
            <h1 className="text-2xl"> Profile  </h1>

            {/* general inputs */}
            <div className="card-1 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-6 items-start justify-start ">
                    <div className="w-20 h-20 md:mt-3 md:w-32 md:h-32 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="size-16 text-gray-600" />
                    </div>
                    <form className="w-full gap-3 flex flex-col " onSubmit={handleFirstForm}>
                        <div className="w-full md:w-96 flex flex-col gap-3">
                            {
                                renderOrder.map((rowItems, idx) => {
                                    const rowFields = fields.filter(f => rowItems.includes(f.name) && !f.hidden);
                                    if (rowFields.length === 0) return null;
                                    return (
                                        <div key={idx} className="flex md:flex-row flex-col gap-4">
                                            {rowFields.map((field, fIdx) => (
                                                <div key={fIdx} className="form-group flex-1 relative ">
                                                    <label htmlFor={field.name}>{field.label}</label>
                                                    <div className="relative rounded-md">
                                                        <input
                                                            id={field.name}
                                                            name={field.name}
                                                            type={field.type}
                                                            placeholder={field.placeholder}
                                                            className={`form-control ${formErrors[field.name] ? 'border-red-400' : ''}`}
                                                            required={field.required}
                                                            onChange={handleInputChange}
                                                            disabled={isLoading}
                                                            value={formData[field.name] || ''}
                                                        />
                                                        {isLoading && <div className="animate-shimmer" />}

                                                    </div>
                                                    {formErrors[field.name] && (
                                                        <p className="text-sm text-red-500 my-1 expanding">
                                                            {formErrors[field.name]}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            }
                        </div>
                        <div className="flex items-center justify-end" type="submit">
                            <button className="btn btn-primary w-24" disabled={isLoading}>
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* password */}
            <div className="card-1 flex flex-col gap-3">
                <form className="w-full gap-3 flex flex-col " onSubmit={handleFirstForm2}>
                    <div className="w-full md:w-96 flex flex-col gap-3">
                        {
                            passwordRenderOrder.map((rowItems, idx) => {
                                const rowFields = passwordFields.filter(f => rowItems.includes(f.name) && !f.hidden);
                                if (rowFields.length === 0) return null;
                                return (
                                    <div key={idx} className="flex md:flex-row flex-col gap-4">
                                        {rowFields.map((field, fIdx) => (
                                            <div key={fIdx} className="form-group flex-1 relative ">
                                                <label htmlFor={field.name}>{field.label}</label>
                                                <div className="relative rounded-md">
                                                    <input
                                                        id={field.name}
                                                        name={field.name}
                                                        type={field.type}
                                                        placeholder={field.placeholder}
                                                        className={`form-control ${formErrors[field.name] ? 'border-red-400' : ''}`}
                                                        required={field.required}
                                                        onChange={handleInputChange2}
                                                        disabled={isLoading}
                                                        value={passwordFormData[field.name] || ''}
                                                    />
                                                    {isLoading && <div className="animate-shimmer" />}

                                                </div>
                                                {formErrors[field.name] && (
                                                    <p className="text-sm text-red-500 my-1 expanding">
                                                        {formErrors[field.name]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className="flex items-center justify-end" type="submit">
                        <button className="btn btn-primary w-24" disabled={isLoading}>
                            Save
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}