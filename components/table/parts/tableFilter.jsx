'use client';

import { Dropdown } from "@/components/other/dropdown";
import Select from "@/components/select";
import { saCreateItem, saGetItems } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { toDisplayStr } from "@/utils/other";
import { set } from "lodash";
import { CircleAlert, FilterIcon, ListFilter, Pencil } from "lucide-react";
import { useState, useEffect } from "react";

export const operators = [
    'equals', 'notEquals',
    // 'contains',
    // 'doesNotContain', 'greaterThan', 'lessThan',
    // 'startsWith', 'endsWith'
];

export const sampleFilters = [
    {
        key: 'status',
        label: 'Status',
        operator: 'equals',
        value: 'active',
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ]
    }
]


export default function FilterAndViews({
    data = [], pathname = '', className = '',
    columns = [],
    onChange = () => { },
    account = {},
    user = {},
}) {

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [createdFilters, setCreatedFilters] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);

    // views
    const [filterViews, setFilterViews] = useState([]);
    const [openViewId, setOpenViewId] = useState(null);
    const [editingView, setEditingView] = useState(null);
    const [selectedViewId, setSelectedViewId] = useState(null);

    const handleFilterChange = (_open) => {
        if (!activeFilter) {
            setActiveFilter(getBlankFilter());
        }
        setIsOpen(_open);

    }

    const handleActiveFieldChange = (field, e) => {
        const { value } = e.target;
        const v = value?.value || value?.name || value;
        // console.log('e: ', e);
        // console.log('field, value: ', v);
        setActiveFilter({ ...activeFilter, [field]: v });
    }

    const getActiveFieldValueOptions = () => {
        try {
            let arr = []
            const sc = columns.find(col => col.key === activeFilter?.key);
            if (!sc) return arr;
            if (sc.options) {
                arr = sc.options.map(opt => {
                    return {
                        value: opt.value || opt.name || opt,
                        label: opt.label || toDisplayStr(opt.value || opt),
                    }
                })
            }

            // console.log('arr: ', arr);

            return arr
        } catch (error) {
            console.error('Error getting active field value options: ', error);
            return [];
        }
    }

    const handleApplyFilter = () => {
        setIsOpen(false);
        if (activeFilter && activeFilter.key && activeFilter.operator && activeFilter.value) {
            setSelectedViewId(null); // Clear selected view when applying manual filter
            // console.log('activeFilter: ', activeFilter);
            onChange([activeFilter]);
        }
    }
    const handleResetFilter = () => {
        // setIsOpen(false);
        setActiveFilter(getBlankFilter());
        setSelectedViewId(null); // Clear selected view when resetting
        onChange([]);
    }

    const handleSaveAsView = async () => {
        try {

            let toSaveItem = { ...activeFilter };

            if (!toSaveItem.name) {
                return notify({ type: 'warning', message: 'Please provide a name for the filter view' });
            }
            if (!toSaveItem.key || !toSaveItem.operator || !toSaveItem.value) {
                return notify({ type: 'warning', message: 'Please complete the filter before saving' });
            }

            delete toSaveItem.label;
            delete toSaveItem.options;
            toSaveItem.pathname = pathname;
            toSaveItem.account_id = account ? account.id : null;
            toSaveItem.collection = '';
            toSaveItem.user_id = user ? user.id : null;

            console.log('toSaveItem: ', toSaveItem);


            const response = await saCreateItem({
                collection: 'filter_views',
                data: toSaveItem
            })

            if (response && response.success) {
                notify({ type: 'success', message: 'Filter view saved successfully' });
                setFilterViews([...filterViews, response.data]);
                setActiveFilter(getBlankFilter());
                setIsOpen(false);
            } else {
                notify({ type: 'error', message: response.message || 'Failed to save filter view' });
            }


        } catch (error) {
            console.error('Error saving filter view: ', error);
            notify({ type: 'error', message: 'Failed to save filter view' });
        }
    }

    const handleViewChange = (viewId, _open) => {
        setOpenViewId(_open ? viewId : null);
        if (_open) {
            const view = filterViews.find(v => v.id === viewId);
            if (view) {
                setEditingView({ ...view });
            }
        } else {
            setEditingView(null);
        }
    }

    const handleApplyView = (view) => {
        if (view && view.key && view.operator && view.value) {

            // if already selected, deselect
            if (selectedViewId === view.id) {
                setSelectedViewId(null);
                onChange(activeFilter ? [activeFilter] : []);
                return;
            }

            // Only one view can be selected at a time
            setSelectedViewId(view.id);
            onChange([
                {
                    key: view.key,
                    operator: view.operator,
                    value: view.value
                },
                activeFilter && { ...activeFilter },
            ]);
            setOpenViewId(null);
            setEditingView(null);
            // notify({ type: 'success', message: `Applied filter view: ${view.name}` });
        }
    }

    const handleViewFieldChange = (field, e) => {
        const { value } = e.target;
        const v = value?.value || value?.name || value;
        setEditingView({ ...editingView, [field]: v });
    }

    const handleSaveView = async () => {
        try {

            if (!editingView.name) {
                return notify({ type: 'warning', message: 'Please provide a name for the filter view' });
            }
            if (!editingView.key || !editingView.operator || !editingView.value) {
                return notify({ type: 'warning', message: 'Please complete the filter before saving' });
            }

            let toSaveItem = { ...editingView };
            delete toSaveItem.label;
            delete toSaveItem.options;

            const response = await saCreateItem({
                collection: 'filter_views',
                data: toSaveItem,
                method: 'PATCH'
            });

            if (response && response.success) {
                notify({ type: 'success', message: 'Filter view updated successfully' });
                const updatedViews = filterViews.map(v =>
                    v.id === editingView.id ? response.data : v
                );
                setFilterViews(updatedViews);
                setOpenViewId(null);
                setEditingView(null);
            } else {
                notify({ type: 'error', message: response.message || 'Failed to update filter view' });
            }

        } catch (error) {
            console.error('Error updating filter view: ', error);
            notify({ type: 'error', message: 'Failed to update filter view' });
        }
    }

    const getViewFieldValueOptions = () => {
        try {
            let arr = []
            const sc = columns.find(col => col.key === editingView?.key);
            if (!sc) return arr;
            if (sc.options) {
                arr = sc.options.map(opt => {
                    return {
                        value: opt.value || opt.name || opt,
                        label: opt.label || toDisplayStr(opt.value || opt),
                    }
                })
            }
            return arr
        } catch (error) {
            console.error('Error getting view field value options: ', error);
            return [];
        }
    }



    // // console.log('activeFilter: ', activeFilter);
    // console.log('columns: ', columns);
    // console.log('active field column: ', columns.find(col => col.key === activeFilter?.key));

    useEffect(() => {

    }, [columns.length]);

    // fetching filter views
    useEffect(() => {
        const body = async () => {
            try {

                setIsLoading(true);
                const response = await saGetItems({
                    collection: 'filter_views',
                    query: {
                        where: {
                            account_id: account ? account.id : null,
                            user_id: user ? user.id : null,
                            pathname: pathname,
                        },
                    }
                });
                // console.log('response: ',response);


                if (response && response.success) {
                    setFilterViews(response.data || []);
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to fetch tasks' });
                }


            } catch (error) {
                console.error('Error fetching tasks: ', error);
            } finally {
                setIsLoading(false);
            }
        };
        body();
    }, [pathname, account?.id, user?.id]);


    // make sure filter and view and not opened at the same time
    useEffect(() => {
        if (isOpen && openViewId) {
            setIsOpen(false);
            setOpenViewId(null);
        }
    }, [isOpen, openViewId]);

    // console.log('filterViews: ', filterViews);
    // console.log('activeFilter: ', activeFilter);


    return (
        <div className={className}>

            <div className="flex w-full h-11 items-center gap-2 overflow-x-auto">
                {/* views  */}
                {filterViews && filterViews.length > 0 && filterViews.map(view => {

                    const isSelected = selectedViewId === view.id;

                    return (
                        <div
                            key={'filterView_' + view.id}
                            className={`
                            relative px-3 py-1.5 flex gap-3 items-center rounded-md cursor-pointer transition-colors
                            ${isSelected
                                    ? 'bg-blue-200 hover:bg-blue-250'
                                    : 'bg-blue-50 hover:bg-blue-100'
                                }
                      `}
                        >

                            <button
                                className="flex items-center gap-2"
                                onClick={(open) => handleApplyView(view)}
                            >
                                <ListFilter className="size-4" />
                                <div className="flex flex-col text-base">
                                    <span className="text-nowrap font-semibold">
                                        {view.name || ''}
                                    </span>
                                    {/* <span className=" text-gray-500">
                                    ({view.key} {view.operator} {view.value})
                                </span> */}
                                </div>
                            </button>

                            <Dropdown
                                fixed={true}
                                className=""
                                onOpen={(open) => handleViewChange(view.id, open)}
                                isOpen={openViewId === view.id}

                            >

                                {!isSelected &&
                                    <div
                                        data-type="trigger"
                                        className="relative mt-1 flex gap-2 items-center rounded-md bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                                    // onClick={() => !openViewId ? handleApplyView(view) : null}
                                    >
                                        <Pencil className="size-4" />

                                    </div>
                                }
                                {
                                    (openViewId === view.id) &&
                                    <div data-type="content" className="p-3 min-w-96">
                                        <div className="mb-3">
                                            <h4 className="font-medium text-sm mb-2">Edit View: {view.name}</h4>
                                        </div>
                                        <FilterItem
                                            filter={editingView}
                                            columns={columns}
                                            onChange={handleViewFieldChange}
                                            onApply={() => handleApplyView(editingView)}
                                            onReset={() => {
                                                setEditingView(null);
                                                setOpenViewId(null);
                                            }}
                                            onSave={handleSaveView}
                                            getActiveFieldValueOptions={getViewFieldValueOptions}
                                            isView={true}
                                        />
                                    </div>
                                }
                            </Dropdown>
                        </div>
                    )
                })}

                <Dropdown fixed={true} className="" onOpen={handleFilterChange} isOpen={isOpen}>
                    <div
                        data-type="trigger"
                        className="w-24 relative gap-2 btn btn-secondary flex items-center "
                    >
                        <FilterIcon className="size-4" />
                        <span>Filter</span>
                        {
                            activeFilter && activeFilter.key && activeFilter.operator && activeFilter.value &&
                            <CircleAlert
                                className="absolute -top-1 -right-1 size-4 fill-yellow-400 text-black "
                            />
                        }
                    </div>
                    {
                        isOpen &&
                        <div data-type="content" className=" p-3">
                            <FilterItem
                                filter={activeFilter}
                                columns={columns}
                                onChange={handleActiveFieldChange}
                                onApply={handleApplyFilter}
                                onReset={handleResetFilter}
                                onSaveAsView={handleSaveAsView}
                                getActiveFieldValueOptions={getActiveFieldValueOptions}
                                isView={activeFilter && activeFilter.id}
                            />
                        </div>
                    }
                </Dropdown>
            </div>
        </div>
    );
}

export const getBlankFilter = () => {
    const sample = sampleFilters[0];

    // make all fields empty
    return {
        key: '',
        label: '',
        operator: '',
        value: '',
        options: []
    };
}

export const FilterItem = ({
    filter,
    columns = [],
    isView = false,
    className = '',
    onChange = () => { },
    onApply = () => { },
    onSave = () => { }, //save as view
    onReset = () => { },
    onDelete = () => { },
    onSaveAsView = () => { },
    getActiveFieldValueOptions = () => [],
}) => {

    const handleActiveFieldChange = (field, e) => {
        onChange(field, e);
    };

    return (
        <div className="flex flex-col gap-3">

            <div className="flex gap-3 bg-white">
                {/* key */}
                <div className="">
                    <label className="block text-sm font-medium">Key</label>
                    <Select
                        className="w-32"
                        placeholder="Key"
                        value={filter?.key}
                        options={columns.map(col => ({ value: col.key, label: toDisplayStr(col.key) }))}
                        onChange={(e) => handleActiveFieldChange('key', e)}
                    />
                </div>

                {/* operator */}
                <div className="min-w-28">
                    <label className="block text-sm font-medium">Operator</label>
                    <Select
                        className="w-24"
                        placeholder="operator"
                        value={filter?.operator}
                        options={operators.map(op => ({ value: op, label: toDisplayStr(op) }))}
                        onChange={(e) => handleActiveFieldChange('operator', e)}
                    />
                </div>

                {/* value */}
                {
                    columns.find(col => col.key === filter?.key)?.options
                        ? <div className="w-60">
                            <label className="block text-sm font-medium">Value</label>
                            <Select
                                className="w-full"
                                value={filter?.value}
                                options={getActiveFieldValueOptions()}
                                placeholder="value"
                                disabled={!filter?.key || !filter?.operator}
                                onChange={(e) => {
                                    handleActiveFieldChange('value', e)
                                }}
                            />
                        </div>
                        : <div className="w-60">
                            <label className="block text-sm font-medium">Value</label>
                            <input
                                type="text"
                                className="form-control"
                                value={filter?.value || ''}
                                onChange={(e) => handleActiveFieldChange('value', e)}
                                disabled={!filter?.key || !filter?.operator}
                            />
                        </div>
                }


            </div>

            <div className="w-full flex  justify-between items-end gap-3">

                <div className="flex items-center gap-3  ">
                    <div className="flex gap-1 p-0.5 items-center bg-yellow-100 rounded-md">
                        {!isView &&
                            <button
                                className="btn px-5 py-1 btn-secondary text-nowrap "
                                onClick={onSaveAsView}
                                disabled={!(
                                    filter && filter.key && filter.operator &&
                                    filter.value && filter.name
                                )}
                            >
                                Save as View
                            </button>
                        }
                        <input
                            type="text"
                            placeholder="view name"
                            required={true}
                            className="form-control p-0.5 "
                            value={filter?.name || ''}
                            onChange={(e) => handleActiveFieldChange('name', e)}
                        />

                    </div>
                </div>
                <div className="flex gap-3">


                    {isView ? (
                        <>
                            <button
                                className="btn px-5 py-1 btn-danger "
                                onClick={onDelete}
                            >
                                Delete
                            </button>
                            <button
                                className="btn px-5 py-1 btn-primary "
                                onClick={onSave}
                            >
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn px-5 py-1 btn-secondary "
                                onClick={onReset}
                                disabled={!(filter && filter.key && filter.operator && filter.value)}
                            >
                                Reset
                            </button>
                            <button
                                className="btn px-5 py-1 btn-primary "
                                onClick={onApply}
                                disabled={!(filter && filter.key && filter.operator && filter.value)}
                            >
                                Apply
                            </button>
                        </>
                    )}
                </div>


            </div>

        </div>
    )
}