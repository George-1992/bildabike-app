'use server';

import bcrypt from 'bcrypt';
import { cookies } from "next/headers";
import jwt from 'jsonwebtoken';
import sendEmail from "@/services/emailing";
import Prisma from "@/services/prisma";
import { nanoid } from "nanoid";

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'session_token';
const EXPIREY_SECONDS = process.env.EXPIREY_SECONDS || 86400; // default 24 hours

const allowSignInUserStatuses = ['active', 'pending'];
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const sessionExpiesIn = `${EXPIREY_SECONDS / 3600}h`;




export const serverSubmit = async ({ type, formData }) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {
        // console.log('serverSubmit type ==> ', type);
        // console.log('serverSubmit formData ==> ', formData);

        if (type === 'signin') {
            resObj = await handleSignin(formData);
        } else if (type === 'signup') {
            resObj = await handleSignup(formData);
        } else if (type === 'reset') {
            resObj = await handleResetPass(formData);
        }

        // console.log('serveSubmit ==> ', response);

        // if successful create session cookie
        if (['signin', 'signup'].includes(type)) {
            if (resObj.success) {
                const data = Array.isArray(resObj.data) ? resObj.data[0] : resObj.data;
                if (!data || !data.id || !data.email) {
                    throw new Error('Invalid user data for session creation');
                }
                resObj.data = data;
            }
        }


        // console.log('serverSubmit resObj ==> ', type, resObj);

        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred. Please try again.';
        resObj.warning = true;
    }
};

export const handleSignout = () => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {
        const cookieStore = cookies();
        cookieStore.delete(SESSION_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        resObj.success = true;
        resObj.message = 'Signed out successfully';
        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.warning = true;
    }
};

// export const createSession = async (data, exp = null) => {
//     let resObj = {
//         success: false,
//         warning: false,
//         message: '',
//         data: null,
//     }
//     try {

//         const token = jwt.sign({
//             ...data
//         }, JWT_SECRET, { expiresIn: sessionExpiesIn });

//         const cookieStore = await cookies();
//         cookieStore.set(SESSION_COOKIE_NAME, token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'lax',
//             maxAge: 24 * 60 * 60, // 24 hours in seconds
//         });

//         resObj.success = true;
//         resObj.message = 'Session created successfully';
//         resObj.data = {
//             token,
//             user: data
//         }
//         return resObj;

//     } catch (error) {
//         console.error(error);
//         resObj.message = 'An error occurred. Please try again.';
//         resObj.warning = true;
//         return resObj;
//     }
// };

export const updateUser = async ({ data }) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {
        if (!data || !data.id) {
            resObj.message = 'User ID is required for update';
            return resObj;
        }

        const updateRes = await Prisma.users.update({
            where: { id: data.id },
            data: {
                status: 'active',
            }
        });
        // console.log('updateRes ==> ', updateRes);


        if (updateRes) {
            resObj.success = true;
            resObj.message = 'User updated successfully';
            resObj.data = updateRes;
        } else {
            resObj.message = 'Failed to update user';
        }

        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = 'An error occurred. Please try again.';
        resObj.warning = true;
        return resObj;
    } finally {
        // Prisma.$disconnect();
    }
};
const handleSignin = async (formData) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {

        if (!formData.email || !formData.password) {
            resObj.message = 'Email and password are required.';
            return resObj;
        }



        const user = await Prisma.users.findFirst({
            where: {
                email: formData.email
            }
        })
        console.log('handleSignin user:', user)

        if (!user) {
            resObj.message = 'User not found.';
            return resObj;
        }

        // console.log('formData.password ==> ', formData.password);
        // console.log('user.password ==> ', user.password);

        // if user found, check password
        const passwordMatch = bcrypt.compareSync(formData.password, user.password);
        // console.log('passwordMatch ==> ', passwordMatch);

        // const cookiesStore = cookies();
        // cookiesStore.set('test-cookie', 'test-value', { httpOnly: true, path: '/' });
        if (!passwordMatch) {
            resObj.success = false;
            resObj.message = 'Incorrect password.';
            resObj.data = null;
            return resObj;
        }
        delete user.password;


        resObj.success = true;
        resObj.message = 'Signin successful.';
        resObj.data = user;
        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        return resObj;
    } finally {
        // Prisma.$disconnect();
    }
};
const handleSignup = async (formData) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    // console.log('handleSignup, formData ==> ', formData);
    // return resObj;

    try {

        const provider = 'email';

        if (!formData.firstName || !formData.lastName) {
            resObj.message = 'First name and last name are required.';
            return resObj;
        }

        if (!formData.email || !formData.password) {
            resObj.message = 'Email and password are required.';
            return resObj;
        }

        // check if user with email already exists
        const existingUserRes = await Prisma.users.findMany({
            where: {
                email: formData.email
            }
        });
        const email = formData.email.toLowerCase().trim();

        if (existingUserRes && existingUserRes.length) {
            resObj.message = 'User with this email already exists.';
            return resObj;
        }

        const hashedPassword = bcrypt.hashSync(formData.password, 10);

        const account = Prisma.accounts.create({
            data: {
                name: formData.accountName || `${formData.firstName} ${formData.lastName}'s Account`,
                status: 'active',
            }
        });

        const utcNow = new Date().toISOString();
        const result = await Prisma.$transaction(async (prisma) => {
            const newAccount = await prisma.accounts.create({
                data: {
                    id: nanoid(),
                    name: 'Default Account',
                    created_at: utcNow,
                    updated_at: utcNow,
                },
            });
            const newWorkspace = await prisma.workspaces.create({
                data: {
                    id: nanoid(),
                    name: 'Default Workspace',
                    account_id: newAccount.id,
                    created_at: utcNow,
                    updated_at: utcNow,
                },
            });

            const newUser = await prisma.users.create({
                data: {
                    id: nanoid(),
                    status: 'active',
                    email: email,
                    password: hashedPassword,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    provider: provider,
                    created_at: utcNow,
                    updated_at: utcNow,
                    users_and_accounts: {
                        create: {
                            id: nanoid(),
                            role: 'owner',
                            account_id: newAccount.id,
                            created_at: utcNow,
                            updated_at: utcNow,
                        },
                    },
                },
                include: {
                    users_and_accounts: true,
                },
            });

            return { newUser, newAccount, newWorkspace };
        });

        const { newUser, newAccount, newWorkspace } = result;

        // console.log('result ==> ', result);


        if (!newAccount) {
            resObj.success = false;
            resObj.message = 'Account creation failed';
            return resObj;
        }

        if (!newUser) {
            resObj.success = false;
            resObj.message = 'User creation failed';
            return resObj;
        }

        // console.log('handleSignup accountRes  ==> ', accountRes);
        // console.log('handleSignup userRes  ==> ', userRes);

        if (newAccount && newUser) {
            // // send verification & activation email
            // const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: sessionExpiesIn });
            // const activateLink = `${DOMAIN}/auth/verify?token=${token}`;
            // sendEmail({
            //     sendTo: newUser.email,
            //     title: 'Please confirm your email',
            //     subject: 'Thank you for signing up !',
            //     elements: [
            //         `<p>Thank you for signing up !</p>`,
            //         `<p>Please confirm your email by clicking the button below to activate your account</p>`,
            //         `<p></p>`,
            //         `<a href="${activateLink}" style="background-color: #fac114; color: black; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Activate Account</a>`,
            //         `<p></p>`,
            //         `<p>Link is active for 2 days</p>`,
            //         `<p></p>`,
            //         `<p></p>`,
            //     ]
            // })

            resObj.success = true;
            resObj.message = 'Signup successful';
            resObj.data = {
                id: newUser.id,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                email: newUser.email,
                status: newUser.status,
                createdAt: newUser.created_at,
                updatedAt: newUser.updated_at,
                accounts: [newAccount],
                workspaces: [newWorkspace],
            };

        }

        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        return resObj;
    } finally {
        // Prisma.$disconnect();
    }
};
const handleResetPass = async (formData) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    try {

        const email = formData.email || '';
        const resetToken = formData.token || '';



        // console.log('user ==> ', user);

        // if user exists send email with reset link
        if (!resetToken) {

            if (!email) {
                resObj.message = 'Email is required.';
                return resObj;
            }

            // check if user with email exists

            const user = await Prisma.users.findFirst({
                where: {
                    email: email
                }
            });
            if (!user) {
                resObj.success = true;
                resObj.message = 'If an account with that email exists, a password reset link has been sent.';
                return resObj;
            }

            const token = jwt.sign({ id: user.id, email: email }, JWT_SECRET, { expiresIn: sessionExpiesIn });
            const resetLink = `${DOMAIN}/auth/reset?token=${token}`;
            sendEmail({
                sendTo: email,
                title: 'Password Reset Request',
                subject: 'Password Reset Request',
                elements: [
                    `<p>We received a request to reset your password.</p>`,
                    `<p>Please click the button below to reset your password.</p>`,
                    `<p></p>`,
                    `<a href="${resetLink}" style="background-color: #fac114; color: black; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Reset Password</a>`,
                    `<p></p>`,
                    `<p>Link is active for 1 day</p>`,
                    `<p></p>`,
                    `<p></p>`,
                ]
            })

            resObj.success = true;
            resObj.message = 'If an account with that email exists, a password reset link has been sent.';
        }

        // if token is provided, verify and reset password
        if (resetToken) {
            // make sure newPassword is provided
            if (!formData.newPassword) {
                resObj.message = 'New password is required.';
                return resObj;
            }

            // verify token
            let tokenData = null;
            try {
                tokenData = jwt.verify(resetToken, JWT_SECRET);
            } catch (error) {
                resObj.message = 'Invalid or expired token.';
                return resObj;
            }

            if (!tokenData || !tokenData.id) {
                resObj.message = 'Invalid token data.';
                return resObj;
            }

            // update user password
            const hashedPassword = bcrypt.hashSync(formData.newPassword, 10);

            const updateRes = await Prisma.users.update({
                where: { id: tokenData.id },
                data: { password: hashedPassword }
            });

            if (updateRes) {
                resObj.success = true;
                resObj.message = 'Password has been reset successfully.';
            } else {
                resObj.message = 'Failed to reset password.';
            }

        }



        return resObj;
    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        resObj.warning = true;
        return resObj;
    } finally {
        // Prisma.$disconnect();
    }
};



// session related functions

export const getSession = async () => {

    try {

        // code here
        let session = null;
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

        // console.log('sessionCookie ==> ', sessionCookie);
        if (!cookieStore) {
            return null;
        }
        if (!sessionCookie) {
            return null;
        }
        if (!JWT_SECRET) {
            return null;
        }
        if (!jwt) {
            return null;
        }

        try {
            if (sessionCookie && sessionCookie.name && sessionCookie.value && sessionCookie.name === SESSION_COOKIE_NAME) {
                // Verify and decode the JWT
                const decoded = jwt.verify(sessionCookie.value, JWT_SECRET);
                session = { ...decoded };
                // console.log('decoded session ==> ', session);
            }
        } catch (error) {
            console.error('getSession inner error ==> ', error?.message || error);
        }

        // if session has expired destroy it
        if (!session) {
            // // await destroySession();
            // const cookieStore = await cookies();
            // cookieStore.set(SESSION_COOKIE_NAME, 'aaaa', {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'lax',
            //     maxAge: 0, // 0 means delete the cookie
            //     path: '/'
            // });
        } else {
            // // extend by 24 hours
            // const timestamp = Date.now() / 1000
            // const expiryDate = new Date(timestamp * 1000 + (24 * 60 * 60 * 1000));
            // cookieStore.set(SESSION_COOKIE_NAME, 'aaaa', {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'lax',
            //     expires: expiryDate,

            // });
        }

        return session;

    } catch (error) {
        console.error('getSession error ==> ', error);
        return null;
    }
}

export const extendSession = async (data) => {
    return await createSession(data);
}

export const createSession = async (data, exp = null) => {
    try {

        let payload = { ...data };
        const jwtExpiry = Math.floor(Date.now() / 1000) + (EXPIREY_SECONDS); // default 1 minute expiry
        payload.exp = jwtExpiry;


        // Sign the token
        const token = jwt.sign(payload, JWT_SECRET);

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: EXPIREY_SECONDS, // 24 hours
            path: '/'
        });

        const resObj = { success: true, token };

        // console.log('createSession resObj ==> ', resObj);


        return resObj;

    } catch (error) {
        console.error('createSession error ==> ', error);
        return { success: false, message: 'Failed to create session' };
    }
}

export const verifySession = async (token) => {
    try {
        if (!token) {
            return null;
        }

        const d = jwt.verify(token, JWT_SECRET);
        return d;
    } catch (error) {
        console.error('verifySession error ==> ', error);
        return null;
    }
}

export const destroySession = async () => {
    try {
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // 0 means delete the cookie
            path: '/'
        });
        return { success: true };

    } catch (error) {
        console.error('destroySession error ==> ', error);
        return { success: false, message: 'Failed to destroy session' };
    }
}

export const refreshSession = async () => {
    try {
        const userData = await verifySession();
        if (!userData) {
            return { success: false, message: 'No valid session to refresh' };
        }

        // Create new session with same user data
        return await createSession(userData);

    } catch (error) {
        console.error('refreshSession error ==> ', error);
        return { success: false, message: 'Failed to refresh session' };
    }
}

export const getCookie = async (name) => {
    try {
        if (!name) return null;
        const cookieStore = await cookies();
        return cookieStore.get(name);
    } catch (error) {
        console.error('getCookie error ==> ', error);
        return null;
    }
}
