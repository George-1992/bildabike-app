'use client';

import { serverSubmit } from "@/actions/auth";
import SigninEl from "@/components/auth/signinEl";
import SignoutEl from "@/components/auth/signoutEl";
import Tabs, { TabTrigger } from "@/components/other/tabs";
import { notify } from "@/components/sonnar/sonnar";
import TurnstileEl from "@/components/turnstile";
import { isAuthPath } from "@/utils/other";
import Validators from "@/utils/validation";
import { Loader, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NEXT_PUBLIC_PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME || 'Dashboard';


export default function AuthEl({ type = 'signin', pathname, searchParams }) {

    const resetToken = searchParams?.token || null;
    // console.log('AuthEl resetToken ==> ', type, resetToken);

    const authProviders = [
        {
            name: 'Google',
            icon: '/images/other/google-logo.png',
            enabled: false,
        },
        {
            name: 'Apple',
            icon: '/images/other/apple-logo.png',
            enabled: false,
        }
    ]

    const allFields = [
        {
            name: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name',
            type: 'text',
            required: true,
            hidden: false,
            validateKey: 'firstName'
        },
        {
            name: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            type: 'text',
            required: true,
            hidden: false,
            validateKey: 'lastName'
        },
        {
            name: 'email',
            label: 'Email',
            placeholder: 'Enter your email',
            type: 'email',
            required: true,
            hidden: false,
            validateKey: 'email'
        },
        {
            name: 'password',
            label: 'Password',
            placeholder: 'Enter your password',
            type: 'password',
            required: true,
            hidden: false,
            validateKey: 'password'
        }
    ]

    const fields = (() => {
        if (type === 'signin') {
            return allFields.filter(f => f.name !== 'firstName' && f.name !== 'lastName')
        } else if (type === 'signup') {
            return allFields;
        } else if (type === 'reset') {
            if (resetToken) {
                const passField = allFields.find(f => f.name === 'password');
                return [
                    { ...passField, label: 'New Password', placeholder: 'Enter your new password', name: 'newPassword' },
                    { ...passField, label: 'Repeat New Password', placeholder: 'Re-enter your new password', name: 'repeatNewPassword' }
                ]
            }
            return allFields.filter(f => f.name === 'email')
        }
    })()

    const renderOrder = (() => {
        if (type === 'reset' && resetToken) {
            return [
                ['newPassword'],
                ['repeatNewPassword']
            ];
        }
        return [
            ['firstName', 'lastName'],
            ['email'],
            ['password']
        ];
    })();


    const [thisField, setThisField] = useState(fields);
    const [activeTab, setActiveTab] = useState(type === 'signin' ? 0 : 1);
    const [formData, setFormData] = useState(Object.fromEntries(fields.map(f => [f.name, ''])));
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const [isTurnstile, setIsTurnstile] = useState(false);
    const [handleTurnstileVerify, setTurnstileVerified] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);
    const [successData, setSuccessData] = useState(null);

    const router = useRouter();


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            if (!handleTurnstileVerify) {
                // Show error message
                notify({ type: 'error', message: 'Please complete the CAPTCHA' });
                return;
            }


            if (type === 'reset' && resetToken) {
                if (formData.newPassword !== formData.repeatNewPassword) {
                    notify({ type: 'error', message: 'Passwords do not match' });
                    return;
                }
            }


            for (const key of Object.keys(formData)) {
                const validateKey = thisField.find(f => f.name === key)?.validateKey;

                if (Validators[validateKey]) {
                    const valid = Validators[validateKey](formData[key]);
                    if (!valid.isValid) {
                        // show error
                        // console.log('valid ==> ', valid);
                        setFormErrors(prev => ({ ...prev, [key]: valid.errors.join(', ') }));

                        // notify({ type: 'error', message: valid.errors.join(', ') });
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // make request
            setIsLoading(true);
            // dummy 0.5s delay
            await new Promise(res => setTimeout(res, 500));

            if (resetToken) {
                formData.token = resetToken;
            }
            const submitRes = await serverSubmit({
                type, formData
            })
            // console.log('submitRes ==> ', submitRes);


            if (!submitRes.success) {
                notify({ type: 'error', message: submitRes.message || 'Submission failed' });
            } else {
                if (submitRes.data && submitRes.data.length === 0) {
                    notify({ type: 'error', message: submitRes.message || 'No user data returned' });
                } else {
                    notify({ type: 'success', message: submitRes.message || 'Success!' });
                    // router.push('/');
                    setIsSuccess(true);
                    setSuccessData(submitRes);

                    // redirect to signin after reset
                    if (type === 'reset' && resetToken) {
                        router.push('/auth/signin');
                    }
                }
            }

        } catch (error) {
            console.error('Error during form submission', error);
            notify({ type: 'error', message: error.message || 'An unexpected error occurred' });
        } finally {
            setIsLoading(false);
        }

    }

    const getHeaderTitle = () => {
        if (type === 'signin') {
            return 'Welcome back';
        } else if (type === 'signup') {
            return 'Create an account';
        } else if (type === 'reset') {
            return 'Reset your password';
        }
        return ''
    }
    const getHeaderDesc = () => {
        if (type === 'signin') {
            return 'Sign in to your account to continue';
        } else if (type === 'signup') {
            return 'Sign up for a new account to get started';
        }
        return ''
    }

    const getButtonText = () => {
        if (type === 'signin') {
            return 'Sign In';
        } else if (type === 'signup') {
            return 'Sign Up';
        } else if (type === 'reset') {
            return 'Get Reset Link';
        }
        return 'Continue';
    }

    // console.log('formErrors ==> ', formErrors);
    useEffect(() => {
        // on value change set form errors to empty
        setFormErrors({});

        if (isAuthPath(pathname)) {
            let allOkay = true;
            for (const f of Object.values(formData)) {
                if (!f) {
                    allOkay = false;
                    break;
                }
            }
            if (allOkay !== isTurnstile) {
                setIsTurnstile(allOkay);
            }
        }
    }, [Object.values(formData).join('')]);


    // if auth us successful, show signin element
    if (isSuccess && ['signin', 'signup'].includes(type)) {
        return <SigninEl signResData={successData} />
    }

    return (
        <div className="w-full h-full flex justify-center"  >



            <div className="w-[90%] md:w-[450px] min-h-60 mt-10 ">
                {/* branding */}
                <div className="flex justify-center gap-3 mb-3 p-3 rounded-xl items-center glass-card bg-slate-50">
                    <Image
                        src="/images/logos/main.png"
                        alt="Logo"
                        width={48}
                        height={48}
                    />
                    <div className="text-3xl">
                        <span className="font-light" >
                            {NEXT_PUBLIC_PROJECT_NAME}
                        </span>

                    </div>
                </div>

                {/* body */}
                <div className="flex flex-col gap-4 bg-white rounded-xl shadow-lg p-6 border border-gray-200 slide-up-once">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 ">

                        {/* header */}
                        <div className="flex flex-col justify-start mt-3 mb-6">
                            <h2 className="text-xl font-semibold">
                                {getHeaderTitle()}
                            </h2>
                            <p className="text-sm opacity-55">
                                {getHeaderDesc()}
                            </p>
                        </div>
                        {/* inputs */}
                        <div className="flex flex-col gap-2 mb-4">
                            {
                                renderOrder.map((rowItems, idx) => {
                                    const rowFields = thisField.filter(f => rowItems.includes(f.name) && !f.hidden);
                                    if (rowFields.length === 0) return null;
                                    return (
                                        <div key={idx} className="flex gap-4">
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
                            {/* forgot password */}
                            {type === 'signin' &&
                                <div className="flex justify-end items-start opacity-60">
                                    <Link href="/auth/reset" className="text-sm text-gray-500 hover:underline">
                                        Forgot your password?
                                    </Link>
                                </div>
                            }

                        </div>


                        {/* submit button */}
                        <button
                            className="btn btn-primary relative flex items-center gap-4"
                            type="submit" disabled={isLoading}
                        >
                            {getButtonText()}
                            <Loader2 className={`h-4 w-4 animate-spin ${isLoading ? 'inline-block' : 'hidden'}`} />
                            {isLoading && <div className="animate-shimmer" />}
                        </button>
                    </form>

                    {/* turnstyle */}
                    {isTurnstile &&
                        <div className="w-full h-14 flex justify-center items-center">
                            <div className="max-w-80">
                                <TurnstileEl onVerify={() => { setTurnstileVerified(true) }} />
                            </div>
                        </div>
                    }

                    {/* auth providers */}

                    {
                        authProviders && authProviders.length > 0 && ['signin', 'signup'].includes(type) &&
                        <>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <span className="text-sm text-gray-500">or continue with</span>
                                <div className="h-px bg-gray-300 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {authProviders.map((provider, index) => (
                                    <div key={index} className={`
                                flex items-center gap-2 justify-center cursor-pointer border border-gray-300 shadow-sm p-2 rounded-md 
                                ${!provider.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 transition'}
                                `}>
                                        <Image width={40} height={40} src={provider.icon} alt={provider.name} className="h-6 w-6" />
                                        <span className="text-sm">{provider.name}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    }

                    {/* links */}
                    <div className="mt-5 opacity-85">
                        {/* signup link */}
                        {
                            type === 'signin' &&
                            <div className="flex justify-center items-start ">
                                <Link href="/auth/signup" className="text-sm text-gray-500 hover:underline">
                                    Don't have an account? Sign up
                                </Link>
                            </div>
                        }
                        {/* signin link */}
                        {
                            type !== 'signin' &&
                            <div className="flex justify-center items-start">
                                <Link href="/auth/signin" className="text-sm text-gray-500 hover:underline">
                                    Already have an account? Sign in
                                </Link>
                            </div>
                        }
                    </div>

                </div>


                {/* muted text */}
                <div className="flex flex-col items-center mt-4">
                    <p className="text-sm w-80 text-center opacity-55 mt-4 px-2">
                        By clicking continue, you agree to our Terms of &nbsp;
                        <span className="underline">Service</span>&nbsp;
                        and <span className="underline">Privacy Policy</span>.
                    </p>
                </div>

                {/* spacer */}
                <div className="h-20 w-full"></div>

            </div>


        </div>
    );
}


export { SignoutEl, SigninEl };
