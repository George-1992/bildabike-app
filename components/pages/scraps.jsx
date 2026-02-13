'use client';

import { saCreateItem, saGetItems, saUpdateItem, saDeleteItem, saDeleteItems } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { ExpandableModal, PopupModal } from "@/components/other/modals";
import Table from "@/components/table";
import { cloneDeep } from "lodash";
import { useState, useEffect } from "react";
import FormBuilder from "@/components/formBuilder";
import startScrape from "@/actions/scrape";
import CopyButton from "@/components/other/copyButton";

export default function Scraps({ pathname, user, account, session, workspace }) {
    const wId = workspace?.id || null;
    const collectionName = "scraps";
    const [_isLoading, _setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });
    const [_editItem, _setEditItem] = useState(null);

    const normalizeResult = (value) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch (error) {
                return { __parseError: error?.message || "Invalid JSON" };
            }
        }
        return value;
    };

    const formatResult = (value) => {
        if (value === null || value === undefined || value === "") return "";
        if (typeof value === "string") return value;
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return "";
        }
    };

    const updateItem = async ({ item, action }) => {
        let resObj = {
            success: false,
            message: "Unknown error",
            data: null,
        };
        try {
            _setIsLoading(true);

            let toSaveData = cloneDeep(item);
            toSaveData.workspace_id = wId;
            console.log("toSaveData: ", toSaveData);

            if (Object.prototype.hasOwnProperty.call(toSaveData, "result")) {
                const normalized = normalizeResult(toSaveData.result);
                if (normalized && normalized.__parseError) {
                    notify({ type: "error", message: normalized.__parseError });
                    resObj.success = false;
                    resObj.message = normalized.__parseError;
                    return resObj;
                }
                toSaveData.result = normalized;
            }

            if (action === "update") {
                ["resumes"].forEach(relKey => {
                    if (toSaveData.hasOwnProperty(relKey)) {
                        delete toSaveData[relKey];
                    }
                });
            }

            let response;

            if (action === "create") {
                response = await saCreateItem({
                    collection: collectionName,
                    data: toSaveData
                });

                if (response && response.success) {
                    let newData = [..._data];
                    newData.unshift(response.data);
                    _setData(newData);
                    notify({ type: "success", message: "Scrap created successfully" });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = "Done";
                } else {
                    notify({ type: "error", message: response.message || "Failed to create scrap" });
                    resObj.success = false;
                    resObj.message = response.message || "Failed to create scrap";
                }
            } else if (action === "update") {
                response = await saUpdateItem({
                    collection: collectionName,
                    query: {
                        where: { id: item.id },
                        data: toSaveData,
                    }
                });

                if (response && response.success) {
                    _setData(prev => prev.map(i => i.id === item.id ? response.data : i));
                    notify({ type: "success", message: "Scrap updated successfully" });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = "Done";
                } else {
                    notify({ type: "error", message: response.message || "Failed to update scrap" });
                    resObj.success = false;
                    resObj.message = response.message || "Failed to update scrap";
                }
            } else if (action === "delete") {
                response = await saDeleteItem({
                    collection: collectionName,
                    query: {
                        where: { id: item.id }
                    }
                });

                if (response && response.success) {
                    _setData(prev => prev.filter(i => i.id !== item.id));
                    notify({ type: "success", message: "Scrap deleted successfully" });
                    resObj.success = true;
                    resObj.message = "Done";
                } else {
                    notify({ type: "error", message: response.message || "Failed to delete scrap" });
                    resObj.success = false;
                    resObj.message = response.message || "Failed to delete scrap";
                }
            }

            return resObj;
        } catch (error) {
            console.error(`Error ${action}ing scrap: `, error);
            notify({ type: "error", message: error.message || `Failed to ${action} scrap` });
            resObj.success = false;
            resObj.message = error.message || `Failed to ${action} scrap`;
            resObj.data = item;
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
                        workspace_id: workspace ? workspace.id : null
                    },
                    orderBy: {
                        created_at: "desc"
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
                notify({ type: "error", message: response.message || `Failed to fetch ${collectionName}` });
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
    };

    const onBulkAction = async ({ action, items }) => {
        let resObj = {
            success: false,
            message: "Unknown error",
            data: null,
        };
        try {
            let thisResponse = null;
            if (action === "delete") {
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
                    notify({ type: "success", message: "Items deleted successfully" });
                    resObj.success = true;
                    resObj.message = "Done";
                } else {
                    notify({ type: "error", message: thisResponse.message || "Failed to delete items" });
                    resObj.success = false;
                    resObj.message = thisResponse.message || "Failed to delete items";
                }
            }

            return resObj;
        } catch (error) {
            console.error("Error in onBulkAction: ", error);
            notify({ type: "error", message: "Bulk action failed" });
            resObj.success = false;
            resObj.message = error.message || "Bulk action failed";
            return resObj;
        }
    };

    const handleEditSubmit = async (item) => {
        _setEditItem({
            ...item,
            result: formatResult(item?.result)
        });
    };
    const handleNewItemClick = () => {
        // generate name + date, replace space with _ and / with -
        const newName = `scrap_${new Date().toLocaleString().replace(/[/:,]/g, "-").replace(/ /g, "_")}`;
        _setEditItem({
            name: newName,
            result: "",
        });
    };

    const handleFormSubmit = async (formData) => {
        if (Object.prototype.hasOwnProperty.call(formData, "result")) {
            const normalized = normalizeResult(formData.result);
            if (normalized && normalized.__parseError) {
                notify({ type: "error", message: normalized.__parseError });
                return;
            }
            formData = { ...formData, result: normalized };
        }
        if (_editItem.id) {
            await updateItem({ item: { ..._editItem, ...formData }, action: "update" });
        } else {
            const newItem = await updateItem({ item: { ...formData }, action: "create" });

            // initialize scrape for this item
            if (newItem.success) {
                startScrape({
                    data: newItem.data,
                    workspaceId: wId,
                });
            }
        }
        _setEditItem(null);
    };

    useEffect(() => {
        fetchData();
    }, []);


    return (
        <div className="container-main flex flex-col gap-4">
            <h1 className="text-2xl">Scraps</h1>

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
                    onRowChange={(item) => updateItem({ item, action: "update" })}
                    onRowDelete={(item) => updateItem({ item, action: "delete" })}
                    onBulkAction={onBulkAction}
                    actions={[
                        {
                            name: "edit",
                            onlyCallback: true,
                            func: handleEditSubmit
                        },
                        {
                            name: "delete",
                            confirm: {
                                title: "Confirm Deletion",
                                message: "Are you sure you want to delete this scrap?",
                                button1: "Cancel",
                                button2: "Delete",
                            },
                            func: (item) => updateItem({ item, action: "delete" })
                        }
                    ]}
                    columns={[
                        {
                            key: "name",
                            title: "Name",
                            width: "w-64",
                            required: true,
                            validateKey: "length",
                        },
                        {
                            key: "status",
                            title: "Status",
                            width: "w-64",
                            editable: false,
                            disabled: true,
                            Component: (props) => {
                                const status = props.value || "pending";
                                const colorMap = {
                                    pending: "bg-yellow-100 text-yellow-800",
                                    completed: "bg-green-100 text-green-800",
                                    failed: "bg-red-100 text-red-800"
                                };
                                const colorClass = colorMap[status] || "bg-gray-100 text-gray-800";
                                return (
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
                                        {status}
                                    </span>
                                );
                            }
                        },
                        {
                            key: "result",
                            title: "Result",
                            width: "w-[520px]",
                            editable: false,
                            disabled: true,
                            Component: (props) => {
                                const formatted = formatResult(props.value);
                                if (!formatted) return <span className="text-gray-400">No result</span>;
                                return (
                                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">
                                        {formatted ? 'Date Available' : 'No result'}
                                    </pre>
                                );
                            },
                            // EditComponent: (props) => {
                            //     const formatted = formatResult(props.value);
                            //     if (!formatted) return <span className="text-gray-400">No result</span>;
                            //     return (
                            //         <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">
                            //            aaaa {formatted}
                            //         </pre>
                            //     );
                            // }
                        }
                    ]}
                />
            </div>

            {
                _editItem && <ExpandableModal isOpen={true} onClose={() => _setEditItem(null)}>
                    <div className="flex flex-col gap-4">
                        <FormBuilder
                            formData={_editItem}
                            onSubmit={handleFormSubmit}
                            fields={[
                                {
                                    name: "name",
                                    label: "Name",
                                    type: "text",
                                    required: true,
                                },
                                {
                                    name: "result",
                                    label: (value) => {

                                        return (
                                            <div className="w-full flex text-sm justify-start items-center">
                                                Result
                                                <CopyButton
                                                    value={JSON.stringify(value, null, 2)}
                                                    duration={3000}
                                                />
                                            </div>
                                        )
                                    },
                                    type: "textarea",
                                    disabled: true,
                                    className: "h-96 font-mono text-xs",
                                }
                            ]}
                        />
                    </div>
                </ExpandableModal>
            }
        </div>
    );
}
