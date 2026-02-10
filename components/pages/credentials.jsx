'use client';
import Loading from "@/components/other/loading";
import { saCreateItem, saDeleteItem, saGetItems, saUpdateItem } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { useState, useEffect } from "react";
import { Key, Shield, Eye, EyeOff, Database, FileText, Calendar, Copy, Check } from "lucide-react";
import { makeFirstLetterUppercase } from "@/utils/other";

export default function Credentials({ pathname, user, account, session }) {

    const collectionName = 'credentials';
    const [isLoading, setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [copiedId, setCopiedId] = useState(null);

    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            // add account_id to item if you have account-based filtering
            item.account_id = account ? account.id : null;

            const response = await saCreateItem({
                collection: collectionName,
                data: item
            });

            console.log('Response from adding new credential: ', response);
            if (response && response.success) {
                _setData(prev => [...prev, response.data]);
                // notify({ type: 'success', message: 'Credential created successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create credential';
                notify({ type: 'error', message: response.message || 'Failed to create credential' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new credential: ', error);
            notify({ type: 'error', message: 'Failed to create credential' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create credential';
            return resObj;
        }
    };

    const handleUpdateItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: { id: item.id },
                    data: item
                }
            });

            console.log('Response from updating credential: ', response);

            if (response && response.success) {
                _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                notify({ type: 'success', message: 'Credential updated successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to update credential' });
                resObj.message = response.message || 'Failed to update credential';
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating credential: ', error);
            notify({ type: 'error', message: 'Failed to update credential' });
            resObj.message = error.message || 'Failed to update credential';
            resObj.data = item;
            resObj.success = false;
            return resObj;
        }
    };

    const handleDeleteItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            const response = await saDeleteItem({
                collection: collectionName,
                query: {
                    where: { id: item.id }
                }
            });

            if (response && response.success) {
                _setData(prev => prev.filter(i => i.id !== item.id));
                // notify({ type: 'success', message: 'Credential deleted successfully' });
                resObj.success = true;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete credential' });
                resObj.message = response.message || 'Failed to delete credential';
                resObj.success = false;
            }

            return resObj;
        } catch (error) {
            console.error('Error deleting credential: ', error);
            notify({ type: 'error', message: 'Failed to delete credential' });
            resObj.message = error.message || 'Failed to delete credential';
            resObj.data = item;
            resObj.success = false;
            return resObj;
        }
    };

    const handleCopyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            notify({ type: 'success', message: 'Copied to clipboard!' });
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            notify({ type: 'error', message: 'Failed to copy to clipboard' });
        }
    };

    // initial load, fetch data
    useEffect(() => {
        const body = async () => {
            try {
                setIsLoading(true);
                const response = await saGetItems({
                    collection: collectionName,
                    query: {
                        where: {
                            account_id: account ? account.id : null // uncomment if using account-based filtering
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    }
                });

                console.log('Fetched credentials: ', response);

                if (response && response.success) {
                    _setData(response.data || []);
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to fetch credentials' });
                }

            } catch (error) {
                console.error('Error fetching credentials: ', error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, []);

    const getCredentialStats = () => {
        try {
            if (!_data || !Array.isArray(_data)) return { total: 0, recent: 0, withNotes: 0 };

            const total = _data.length;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const recent = _data.filter(credential =>
                new Date(credential.created_at) > weekAgo
            ).length;

            const withNotes = _data.filter(credential =>
                credential.notes && credential.notes.trim() !== ''
            ).length;

            return { total, recent, withNotes };
        } catch (error) {
            return { total: 0, recent: 0, withNotes: 0 };
        }
    };

    const stats = getCredentialStats();

    return (
        <div className="container-main w-full flex flex-col gap-6">
            <h1 className="text-2xl flex items-center gap-2">
                <Shield className="w-7 h-7 text-green-500" />
                Credentials
            </h1>

            <div className="w-full flex flex-wrap gap-4">
                <div className="card-1 flex flex-1 h-20 relative">
                    <div className="w-full h-full flex">
                        <div className="w-full">
                            <div className="">
                                <span className="text-2xl font-semibold">
                                    {stats.total}
                                </span>
                            </div>
                            <div className="">Total Credentials</div>
                        </div>
                        <div className="w-12 opacity-70">
                            <Key className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <Loading loading={isLoading} />
                </div>

                <div className="card-1 flex flex-1 h-20 relative">
                    <div className="w-full h-full flex">
                        <div className="w-full">
                            <div className="">
                                <span className="text-2xl font-semibold">
                                    {stats.recent}
                                </span>
                            </div>
                            <div className="">Recent (7 days)</div>
                        </div>
                        <div className="w-12 opacity-70">
                            <Calendar className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                    <Loading loading={isLoading} />
                </div>

                <div className="card-1 flex flex-1 h-20 relative">
                    <div className="w-full h-full flex">
                        <div className="w-full">
                            <div className="">
                                <span className="text-2xl font-semibold">
                                    {stats.withNotes}
                                </span>
                            </div>
                            <div className="">With Notes</div>
                        </div>
                        <div className="w-12 opacity-70">
                            <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                    </div>
                    <Loading loading={isLoading} />
                </div>
            </div>

            <div className="w-full relative rounded-md overflow-x-auto">
                <Table
                    className="card-1 min-w-full"
                    editable={true}
                    editableInline={false}
                    allowAddNew={true}
                    actions={['edit', 'delete', 'preview']}
                    previewKey="notes"
                    editRenderOrder={[
                        ['name', 'username'],
                        ['pass'],
                        ['notes']
                    ]}
                    columns={[
                        {
                            key: 'name',
                            title: 'Name/Service',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                            Component: ({ value, row }) => (
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">{value}</span>
                                </div>
                            )
                        },
                        {
                            key: 'username',
                            title: 'Username',
                            width: 'w-40',
                            required: true,
                            Component: ({ value, row }) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-700">{value}</span>
                                    <button
                                        onClick={() => handleCopyToClipboard(value, `${row.id}-username`)}
                                        className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                        title="Copy username"
                                    >
                                        {copiedId === `${row.id}-username` ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                </div>
                            )
                        },
                        {
                            key: 'pass',
                            title: 'Password',
                            width: 'w-32',
                            required: true,
                            type: 'password',
                            validateKey: 'length',
                            Component: ({ value, row }) => {
                                // console.log('Password field rendered', value);

                                return (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-700 font-mono text-sm">
                                            {'••••••••'}
                                        </span>

                                        <button
                                            onClick={() => handleCopyToClipboard(value, `${row.id}-password`)}
                                            className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"
                                            title="Copy password"
                                        >
                                            {copiedId === `${row.id}-password` ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'notes',
                            title: 'Notes',
                            width: 'w-64',
                            type: 'textarea',
                            Component: ({ value, row }) => (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <span className="text-sm text-gray-600 line-clamp-2">
                                            {value && value.length > 80
                                                ? value.substring(0, 80) + '...'
                                                : value || 'No notes'
                                            }
                                        </span>
                                    </div>
                                    {value && (
                                        <FileText className="w-4 h-4 text-gray-400" title="Has notes" />
                                    )}
                                </div>
                            )
                        }
                    ]}
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onChange={(newData) => {
                        console.log('Credentials data changed: ', newData);
                    }}
                />

                <Loading loading={isLoading} />
            </div>
        </div>
    );
}