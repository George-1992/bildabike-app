'use client';
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { useState, useEffect, use } from "react";
import { PopupModal } from "@/components/other/modals";
import Table from "@/components/table";
import FormBuilder from "@/components/formBuilder";


const allowSignInUserStatuses = ['active', 'pending'];

export default function Settings({ params, pathname, searchParams, session, user, account }) {

    const allFields = [
        {
            name: 'id',
            label: 'ID',
            placeholder: 'Enter your ID',
            type: 'text',
            required: true,
            hidden: false,
            disabled: true,
        },
        {
            name: 'name',
            label: 'Name',
            placeholder: 'Enter your name',
            type: 'text',
            required: true,
            hidden: false,
            disabled: false,
        },
    ]

    const fields = allFields
    const renderOrder = [
        ['id'],
        ['name'],
    ];

    const isOwner = user?.role === 'owner';

    const [formData, setFormData] = useState({
        id: account?.id || '',
        name: account?.name || '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [_newUser, _setNewUser] = useState(null);
    const minLoadingTime = 500;

    // users
    const [users, setUsers] = useState([]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                collection: 'accounts',
                query: {
                    where: {
                        id: account?.id
                    },
                    data: {
                        name: formData.name
                    }
                },
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
                    message: 'Updated successfully',
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
    };


    const handleNewUser = async (newUser) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null
        }
        try {

            // console.log('New user data:', newUser);
            // dummy 2s delay to show loading
            // await new Promise(res => setTimeout(res, 2000));

            const response = await saCreateItem({
                collection: 'users',
                data: {
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    email: newUser.email,
                    password: newUser.password,
                    users_and_accounts: {
                        create: {
                            account_id: account?.id,
                            role: newUser.role || 'admin'
                        }
                    }
                }
            })

            console.log('Create user response:', response);
            resObj = response;
            if (response.success) {
                //add to users list
                setUsers(prev => [...prev, response.data]);
            }


            return resObj;

        } catch (error) {
            console.error('Error creating new user: ', error);
            resObj.message = error.message || 'Error creating user';
            return resObj;
        }
    };
    const handleNewUserClick = () => {
        _setNewUser({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
        });
    };
    const handleNewUserSubmit = async (newUser) => {
        try {
            setIsActionLoading(true);
            const resObj = await handleNewUser(newUser);
            if (resObj && resObj.success) {
                _setNewUser(null);
                notify({ type: 'success', message: 'User created successfully' });
            } else {
                notify({ type: 'error', message: resObj.message || 'Failed to create user' });
            }
        } catch (error) {
            console.error('Error creating new user: ', error);
            notify({ type: 'error', message: error.message || 'Failed to create user' });
        } finally {
            setIsActionLoading(false);
        }
    };
    const handleUpdateUser = async (data) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null
        }
        try {
            console.log('Update user data:', data);

            const userId = data.id;
            const response = await saUpdateItem({
                collection: 'users',
                query: {
                    where: { id: data.id },
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        // role: data.role
                    }
                }
            });

            if (response.success) {
                // update users list
                setUsers(prev => prev.map(user => user.id === userId ? response.data : user));
            }

            resObj = response;
            return resObj;

        } catch (error) {
            console.error('Error editing user: ', error);
            resObj.message = error.message || 'Error editing user';
            return resObj;
        }
    };
    const handleDeleteUser = async (data) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null
        }
        try {
            console.log('Delete user data:', data);

            const userId = data.id;
            const response = await saDeleteItem({
                collection: 'users',
                query: {
                    where: { id: userId }
                }
            });

            if (response.success) {
                // remove from users list
                setUsers(prev => prev.filter(user => user.id !== userId));
            }

            resObj = response;
            return resObj;

        } catch (error) {
            console.error('Error deleting user: ', error);
            resObj.message = error.message || 'Error deleting user';
            return resObj;
        }
    };


    // fetch users
    useEffect(() => {
        async function body() {
            try {
                setIsLoading(true);
                let query = {
                    where: {
                        users_and_accounts: {
                            some: {
                                account_id: account.id, // or your accountId variable
                            },
                        },
                    },
                    include: {
                        users_and_accounts: {
                            include: {
                                account: true,
                            },
                        },
                    },
                }

                if (user.role !== 'owner') {
                    query = {
                        where: {
                            id: user.id,
                        },
                        include: {
                            users_and_accounts: {
                                include: {
                                    account: true,
                                },
                            },
                        },
                    }
                }

                const usersRes = await saGetItems({
                    collection: 'users',
                    query: query
                });

                // console.log('Users fetched:', usersRes);

                if (usersRes.success && usersRes.data) {
                    const uData = usersRes.data.map(u => {
                        //add role
                        const role = u.users_and_accounts && u.users_and_accounts.length > 0
                            ? u.users_and_accounts[0].role || 'admin'
                            : 'admin';

                        let d = { ...u, role };
                        if (role === 'owner') {
                            d.disabled = true;
                        }
                        return d;
                    });
                    console.log('Processed users:', uData);

                    setUsers(uData);
                }

            } catch (error) {
                console.error('Error fetching users: ', error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, []);



    // if typing removes errors if any
    const str1 = Object.values(formData).join(', ');
    useEffect(() => {
        if (Object.keys(formErrors).length > 0) {
            setFormErrors({});
        }
    }, [str1]);



    return (
        <div className="container-main flex flex-col gap-6">
            <h1 className="text-2xl"> Settings  </h1>

            {/* general inputs */}
            <div className="card-1 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-6 items-start justify-start ">

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
                                                            disabled={isLoading || field.disabled}
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


            {/* users table */}
            <div className="relative flex items-start justify-start flex-col gap-3 rounded-lg ">
                <h2 className="text-xl">
                    Users
                </h2>
                <Table
                    pathname={pathname}
                    className="card-1 w-full"
                    editable={isOwner ? true : false}
                    editableInline={false}
                    allowAddNew={true}
                    isUserTable={true}
                    actions={['edit', 'delete']}
                    columns={[
                        // { key: 'id', title: 'ID', width: 'w-12', },
                        { key: 'role', title: 'Role', width: 'w-16', required: true, disabled: true, defaultValue: 'admin' },
                        { key: 'first_name', title: 'First Name', width: 'w-60', required: true },
                        { key: 'last_name', title: 'Last Name', width: 'w-60', required: true },
                        { key: 'email', title: 'Email', width: 'w-60', required: true },
                        // {
                        //     key: 'email', title: 'Email', width: 'w-60', required: true,
                        //     Component: ({ value }) => <div className="lowercase bg-red-500">{value}</div>
                        // },
                    ]}
                    data={users}
                    onAddNew={isOwner ? handleNewUserClick : null}
                    onRowChange={handleUpdateUser}
                    onRowDelete={handleDeleteUser}
                // data={[
                //     { id: 1, name: 'John Doe', email: 'john@example.com' },
                //     { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                //     { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
                // ]}
                />

                {isLoading && <div className="animate-shimmer " />}
            </div>

            {_newUser && (
                <PopupModal isOpen={true} onClose={() => _setNewUser(null)}>
                    <div className="flex flex-col gap-4">
                        <FormBuilder
                            formData={_newUser}
                            onSubmit={handleNewUserSubmit}
                            isLoading={isActionLoading}
                            submitButtonText={isActionLoading ? 'Saving...' : 'Save'}
                            fields={[
                                {
                                    name: 'first_name',
                                    label: 'First Name',
                                    type: 'text',
                                    required: true,
                                },
                                {
                                    name: 'last_name',
                                    label: 'Last Name',
                                    type: 'text',
                                    required: true,
                                },
                                {
                                    name: 'email',
                                    label: 'Email',
                                    type: 'email',
                                    required: true,
                                },
                                {
                                    name: 'password',
                                    label: 'Password',
                                    type: 'password',
                                    required: true,
                                }
                            ]}
                        />
                    </div>
                </PopupModal>
            )}

        </div>
    );
}