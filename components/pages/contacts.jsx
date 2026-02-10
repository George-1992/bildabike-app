'use client';

import { saCreateItem, saGetItems, saUpdateItem, saDeleteItem, saDeleteItems } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import Table from "@/components/table";
import { cloneDeep } from "lodash";
import { MailIcon, PhoneIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Contacts({ pathname, user, account, session, workspace }) {


    const wId = workspace?.id || null;
    const collectionName = 'contacts';
    const [_isLoading, _setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_dataOriginal, _setDataOriginal] = useState([]);
    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });



    const handleNewItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            console.log('item: ', item);

            _setIsLoading(true);
            // console.log('handleNewItem item: ', item);
            // add account_id to item if you have account-based filtering
            // item.account_id = account ? account.id : null;

            let toSaveData = cloneDeep(item);
            const od = cloneDeep(item)
            toSaveData.workspace_id = wId;
            // toSaveData = adjustRelationalData({
            //     data: toSaveData,
            //     collection: collectionName,
            //     originalData: {}
            // });


            const response = await saCreateItem({
                collection: collectionName,
                data: toSaveData
            });

            console.log(`Response from adding new ${collectionName}: `, response);
            if (response && response.success) {
                let newData = [..._data];
                let newDataItem = response.data;
                if (item.medias && item.medias.length > 0) {
                    newDataItem.medias = item.medias;
                }
                newData.unshift(newDataItem);
                _setData(newData);
                notify({ type: 'success', message: 'Sources created successfully' });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                resObj.success = false;
                resObj.message = response.message || 'Failed to create sources';
                notify({ type: 'error', message: response.message || 'Failed to create sources' });
            }

            return resObj;
        } catch (error) {
            console.error('Error adding new sources: ', error);
            notify({ type: 'error', message: 'Failed to create sources' });
            resObj.success = false;
            resObj.message = error.message || 'Failed to create sources';
            return resObj;
        } finally {
            _setIsLoading(false);
        }
    };
    const handleUpdateItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            _setIsLoading(true);

            let toSaveData = cloneDeep(item);
            toSaveData.workspace_id = wId;
            // toSaveData = adjustRelationalData({
            //     collection: collectionName,
            //     data: toSaveData,
            //     originalData: _dataOriginal.find(d => d.id === item.id)
            // });
            // console.log('handleNewItem toSaveData: ', toSaveData);
            // return resObj

            // console.log('handleUpdateItem item: ', item);
            // console.log('handleUpdateItem _dataOriginal: ', _dataOriginal.find(d => d.id === item.id));
            // console.log('handleUpdateItem toSaveData: ', toSaveData);
            // return resObj

            const response = await saUpdateItem({
                collection: collectionName,
                query: {
                    where: { id: item.id },
                    data: toSaveData,
                }
            });

            console.log(`Response from updating ${collectionName}: `, response);

            if (response && response.success) {
                _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                notify({ type: 'success', message: `${collectionName} updated successfully` });
                resObj.success = true;
                resObj.data = response.data;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || `Failed to update ${collectionName}` });
                resObj.message = response.message || `Failed to update ${collectionName}`;
                resObj.success = false;
            }

            return resObj;

        } catch (error) {
            console.error('Error updating sources: ', error);
            notify({ type: 'error', message: 'Failed to update sources' });
            resObj.message = error.message || 'Failed to update sources';
            resObj.data = item;
            resObj.success = false;
            return resObj;
        } finally {
            _setIsLoading(false);
        }
    };
    const handleDeleteItem = async (item) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            _setIsLoading(true);
            const response = await saDeleteItem({
                collection: collectionName,
                query: {
                    where: { id: item.id }
                }
            });

            if (response && response.success) {
                _setData(prev => prev.filter(i => i.id !== item.id));
                notify({ type: 'success', message: 'Sources deleted successfully' });
                resObj.success = true;
                resObj.message = 'Done';
            } else {
                notify({ type: 'error', message: response.message || 'Failed to delete sources' });
                resObj.message = response.message || 'Failed to delete sources';
                resObj.success = false;
            }

            return resObj;
        } catch (error) {
            console.error(`Error deleting ${collectionName}: `, error);
            notify({ type: 'error', message: `Failed to delete ${collectionName}` });
            resObj.message = error.message || `Failed to delete ${collectionName}`;
            resObj.data = item;
            resObj.success = false;
            return resObj;
        } finally {
            _setIsLoading(false);
        }
    };
    const fetchData = async (thisPage = _page) => {
        try {
            _setIsLoading(true);
            const response = await saGetItems({
                collection: collectionName,
                includeCount: true,
                query: {
                    where: {
                        // account_id: account ? account.id : null,
                        workspace_id: workspace ? workspace.id : null
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    skip: thisPage.skip,
                    take: thisPage.take,
                }
            });

            console.log(`Fetched ${collectionName}: `, response);

            if (response && response.success) {
                _setData(response.data || []);
                _setDataOriginal(cloneDeep(response.data) || []);
                // if total not set yet
                if (!_page.total) {
                    _setPage(prev => ({
                        ...prev,
                        total: response.count || response.data.length || 0
                    }));
                }
            } else {
                notify({ type: 'error', message: response.message || `Failed to fetch ${collectionName}` });
            }

        } catch (error) {
            console.error(`Error fetching ${collectionName}: `, error);
        } finally {
            _setIsLoading(false);
        }
    };
    const handlePageChange = (newPage) => {
        _setPage(newPage);
        fetchData(newPage);
    }

    const onBulkAction = async ({ action, items }) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {

            let thisResponse = null;
            if (action === 'delete') {
                thisResponse = await saDeleteItems({
                    collection: collectionName,
                    query: {
                        where: {
                            id: {
                                in: items.map(i => i.id)
                            }
                        }
                    }
                });

                if (thisResponse && thisResponse.success) {
                    _setData(prev => prev.filter(i => !items.find(it => it.id === i.id)));
                    notify({ type: 'success', message: 'Items deleted successfully' });
                    resObj.success = true;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: thisResponse.message || 'Failed to delete items' });
                    resObj.success = false;
                    resObj.message = thisResponse.message || 'Failed to delete items';
                }
            }

            return resObj;

        } catch (error) {
            console.error('Error in onBulkAction: ', error);
            notify({ type: 'error', message: 'Bulk action failed' });
            resObj.success = false;
            resObj.message = error.message || 'Bulk action failed';
            return resObj;
        }
    };

    useEffect(() => { fetchData(); }, []);

    // console.log('page: ', _page);

    return (
        <div className="container-main flex flex-col gap-4">
            <h1 className="text-2xl">Contacts Page</h1>


            <div className="w-full">
                <Table
                    className=""
                    editable={true}
                    editableInline={false}
                    allowAddNew={true}
                    sortable={true}
                    // filterable={true}
                    paginated={true}
                    page={_page}
                    onPageChange={handlePageChange}
                    previewKey=""
                    data={_data}
                    onAddNew={handleNewItem}
                    onRowChange={handleUpdateItem}
                    onRowDelete={handleDeleteItem}
                    onBulkAction={onBulkAction}
                    onChange={(newData) => {
                        console.log('Sources data changed: ', newData);
                    }}
                    tableExcludeKeys={[]}
                    editRenderOrder={[
                        ['first_name'],
                        ['last_name'],
                        ['email'],
                        ['phone'],
                    ]}
                    actions={[
                        {
                            name: 'edit',
                        },
                        {
                            name: 'delete',
                            confirm: {
                                title: 'Confirm Deletion',
                                message: 'Are you sure you want to delete this publication?',
                                button1: 'Cancel',
                                button2: 'Delete',
                            },
                            func: handleDeleteItem
                        }
                    ]}
                    columns={[
                        {
                            key: 'first_name',
                            title: 'First Name',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                        },
                        {
                            key: 'last_name',
                            title: 'Last Name',
                            width: 'w-48',
                            required: true,
                            validateKey: 'length',
                        },
                        {
                            key: 'email',
                            title: 'Email',
                            width: 'w-48',
                            Component: (props) => {
                                return (
                                    <div className="flex items-center">
                                        <MailIcon className="w-4 h-4 mr-2 text-gray-500" />
                                        <span>
                                            {props.value}
                                        </span>
                                    </div>
                                )
                            },
                            Component: (props) => {
                                if (!props.value) return null;
                                return (
                                    <div className="flex items-center">
                                        <MailIcon className="w-4 h-4 mr-2 text-gray-500" />
                                        <span>
                                            {props.value}
                                        </span>
                                    </div>
                                )
                            }
                        },
                        {
                            key: 'phone',
                            title: 'Phone',
                            width: 'w-32',
                            Component: (props) => {
                                if (!props.value) return null;
                                return (
                                    <div className="flex items-center">
                                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                                        <span>
                                            {props.value}
                                        </span>
                                    </div>
                                )
                            },
                        },
                    ]}
                />
            </div>
        </div>
    );
}