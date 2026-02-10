'use client';

import { saCreateItem, saGetItems, saUpdateItem, saDeleteItem, saDeleteItems } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { PopupModal } from "@/components/other/modals";
import Table from "@/components/table";
import { cloneDeep } from "lodash";
import { useState, useEffect } from "react";
import FormBuilder from "@/components/formBuilder";

export default function Notes({ pathname, user, account, session, workspace }) {

    const wId = workspace?.id || null;
    const collectionName = 'notes';
    const [_isLoading, _setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });
    const [_editItem, _setEditItem] = useState(null);

    const updateItem = async ({ item, action }) => {
        let resObj = {
            success: false,
            message: 'Unknown error',
            data: null,
        }
        try {
            _setIsLoading(true);

            let toSaveData = cloneDeep(item);
            toSaveData.workspace_id = wId;
            console.log('toSaveData: ', toSaveData);


            // delete relational fields for update
            if (action === 'update') {
                ['resumes'].forEach(relKey => {
                    if (toSaveData.hasOwnProperty(relKey)) {
                        delete toSaveData[relKey];
                    }
                });
            }

            let response;

            if (action === 'create') {
                response = await saCreateItem({
                    collection: collectionName,
                    data: toSaveData
                });

                if (response && response.success) {
                    let newData = [..._data];
                    newData.unshift(response.data);
                    _setData(newData);
                    notify({ type: 'success', message: 'Job created successfully' });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to create job' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to create job';
                }
            } else if (action === 'update') {
                response = await saUpdateItem({
                    collection: collectionName,
                    query: {
                        where: { id: item.id },
                        data: toSaveData,
                    }
                });

                if (response && response.success) {
                    _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                    notify({ type: 'success', message: 'Job updated successfully' });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to update job' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to update job';
                }
            } else if (action === 'delete') {
                response = await saDeleteItem({
                    collection: collectionName,
                    query: {
                        where: { id: item.id }
                    }
                });

                if (response && response.success) {
                    _setData(prev => prev.filter(i => i.id !== item.id));
                    notify({ type: 'success', message: 'Job deleted successfully' });
                    resObj.success = true;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to delete job' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to delete job';
                }
            }

            return resObj;
        } catch (error) {
            console.error(`Error ${action}ing job: `, error);
            notify({ type: 'error', message: error.message || `Failed to ${action} job` });
            resObj.success = false;
            resObj.message = error.message || `Failed to ${action} job`;
            resObj.data = item;
            return resObj;
        } finally {
            _setIsLoading(false);
        }
    }

    const fetchData = async (thisPage = _page) => {
        try {
            _setIsLoading(true);
            const response = await saGetItems({
                collection: collectionName,
                includeCount: true,
                query: {
                    where: {
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

    const handleEditSubmit = async (item) => {
        _setEditItem(item);
    };
    const handleNewItemClick = () => {
        _setEditItem({
            title: '',
            content: '',
        });
    };

    const handleFormSubmit = async (formData) => {
        if (_editItem.id) {
            await updateItem({ item: { ..._editItem, ...formData }, action: 'update' });
        } else {
            await updateItem({ item: { ...formData }, action: 'create' });
        }
        _setEditItem(null);
    };


    useEffect(() => {
        fetchData();

    }, []);

    // console.log('_editItem: ', _editItem);


    return (
        <div className="container-main flex flex-col gap-4">
            <h1 className="text-2xl">Jobs</h1>

            <div className="w-full">
                <Table
                    className=""
                    editable={true}
                    sortable={true}
                    paginated={true}
                    page={_page}
                    onPageChange={handlePageChange}
                    previewKey=""
                    data={_data}
                    onAddNew={handleNewItemClick}
                    onRowChange={(item) => updateItem({ item, action: 'update' })}
                    onRowDelete={(item) => updateItem({ item, action: 'delete' })}
                    onBulkAction={onBulkAction}
                    actions={[
                        {
                            name: 'edit',
                            onlyCallback: true,
                            func: handleEditSubmit
                        },
                        {
                            name: 'delete',
                            confirm: {
                                title: 'Confirm Deletion',
                                message: 'Are you sure you want to delete this job?',
                                button1: 'Cancel',
                                button2: 'Delete',
                            },
                            func: (item) => updateItem({ item, action: 'delete' })
                        }
                    ]}
                    columns={[
                        {
                            key: 'title',
                            title: 'Title',
                            width: 'w-64',
                            required: true,
                            validateKey: 'length',
                        },
                        {
                            key: 'content',
                            title: 'Content',
                            width: 'w-96',
                            type: 'textarea',
                            Component: (props) => {
                                if (!props.value) return <span className="text-gray-400">No content</span>;
                                const truncated = props.value.length > 100 ? props.value.substring(0, 100) + '...' : props.value;
                                return <span className="text-sm text-gray-700">{truncated}</span>;
                            }
                        },
                        // {
                        //     key: 'test2',
                        //     title: 'test2',
                        //     width: 'w-24',
                        //     editable: false,
                        //     Component: (props) => {
                        //         const count = props.value?.length || 0;
                        //         return (
                        //             <div className="flex items-center">
                        //                 <FileTextIcon className="w-4 h-4 mr-2 text-gray-500" />
                        //                 <span className="text-sm text-gray-600">
                        //                     {count}
                        //                 </span>
                        //             </div>
                        //         )
                        //     },
                        // },
                    ]}
                />
            </div>

            {
                _editItem && <PopupModal isOpen={true} onClose={() => _setEditItem(null)}  >
                    <div className="flex flex-col gap-4">
                        <FormBuilder
                            formData={_editItem}
                            onSubmit={handleFormSubmit}
                            fields={[
                                {
                                    name: 'title',
                                    label: 'Title',
                                    type: 'text',
                                    required: true,
                                },
                                {
                                    name: 'content',
                                    label: 'Content',
                                    type: 'textarea',
                                    required: true,
                                    className: 'h-60',
                                }
                            ]}
                        />
                    </div>

                </PopupModal>
            }

        </div>
    );
}