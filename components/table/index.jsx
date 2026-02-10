'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Edit2, Check, X, ChevronLeft, ChevronRight, CircleX, Pencil, Trash, PlusIcon, ArrowBigRight, Eye, ArrowUpToLineIcon, ArrowRightToLineIcon, PickaxeIcon, RotateCcwIcon, Trash2 } from 'lucide-react';
import { PopupModal, ExpandableModal } from '@/components/other/modals';
import FormBuilder from '@/components/formBuilder';
import { notify } from '@/components/sonnar/sonnar';
import DateInput from '@/components/date';
import Select from '@/components/select';
import _, { cloneDeep, isEqual } from 'lodash';
import DateDisplay from '@/components/date/DateDisplay';
import { widthMap } from './helper';
import Link from 'next/link';
import FilterAndViews from '@/components/table/parts/tableFilter';
import { cn } from '@/libs/utils';
import Tooltip from '@/components/other/tultip';

const passwordField = {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    required: true,
    hidden: false,
    validateKey: 'password'
}

const itemsPerPageOptions = [10, 15, 20, 25, 50, 100];

// Table Component with full features
export const Table = ({
    pathname = '',
    className = '',
    columns = [], // { key: 'name', title: 'Name' width: 'w-1/3' sort: 'asc'  }
    data = [],
    searchable = true,
    sortable = true,
    paginated = true,
    pageSize = 10,
    filterable = false,
    editable = false,
    editableInline = false,
    nonEditables = ['id', 'createdAt'],
    actions = ['edit', 'delete'], // ['edit', 'delete', 'preview'] or array of { name: 'custom', Icon: CustomIcon, onClick: func } 
    allowAddNew = false,
    isUserTable = false, // special for users table
    editRenderOrder = [],
    tableExcludeKeys = [], // keys to exclude from table display
    linkPrefix = '', // if view action, link prefix
    previewKey = 'body', // key to use for preview content
    saveButtonTop = false, // show save button at top of modal

    users = [], // for user select options
    leads = [], // for lead select options

    account = {},
    user = {},

    modalType = 'popup', // 'popup' or 'expandable'

    page = { skip: 0, take: 10, itemsPerPage: 10, total: 0 },

    onChange = (updatedData) => { console.log('updatedData:', updatedData); },
    onRowChange = (rowIndex, newRowData) => { console.log('Row Change:', rowIndex, newRowData); return { success: false } },
    onRowDelete = (rowIndex, rowData) => { console.log('Row Delete:', rowIndex, rowData); },
    onAddNew = (newRowData) => { console.log('Add New Row:', newRowData); return { success: false } },
    onPreview = (rowData) => { console.log('Preview:', rowData); },
    onFilter = () => { },
    newItemChange = () => { },
    onPageChange = () => { },
    onBulkAction = null,
}) => {




    const getCols = () => {
        const arr = [];
        if (columns.length > 0) {
            arr.push(...columns);
        } else {
            if (data && data.length) {
                arr.push(...Object.keys(data[0] || {})
                    .map(key => ({ key, title: key })));
            }
        }
        const filteredArr = arr.filter(col =>
            !tableExcludeKeys.includes(col.key)
            && col.type !== 'heading'
            && col.type !== 'element'
        );

        // console.log('Filtered Columns: ', filteredArr);
        return filteredArr;
    };


    const [_originalData, _setOriginalData] = useState(data);
    const [_data, _setData] = useState(data || []);
    const [_columns, _setColumns] = useState(getCols());

    const [searchTerm, setSearchTerm] = useState('');
    const [_sortKey, _setSortKey] = useState(null);
    const [_sortOrder, _setSortOrder] = useState('asc'); // 'asc' or 'desc'

    // editing column, inline
    const [_editingItem, _setEditingItem] = useState(null);
    const [_editingCell, _setEditingCell] = useState(null);

    // edit item popup
    const [_editingItemMain, _setEditingItemMain] = useState(null);
    const [_deletingItem, _setDeletingItem] = useState(null);
    // confirm items
    const [_confirmingItem, _setConfirmingItem] = useState(null);

    const [_newItem, _setNewItem] = useState(null);

    const [_isActionLoading, _setIsActionLoading] = useState(false);

    const [_previewItem, _setPreviewItem] = useState(null);

    const [_page, _setPage] = useState(page);

    // bulk actions
    const [_bulkSelectedIds, _setBulkSelectedIds] = useState([]);
    const [_bulkActtion, _setBulkAction] = useState(null);
    const [_deletingBulkItems, _setDeletingBulkItems] = useState(false);



    const Modal = modalType === 'expandable' ? ExpandableModal : PopupModal;

    const modifiedRowIds = _originalData
        .filter(origRow => {
            // Find matching current row by id
            const currentRow = _data.find(r => r.id === origRow.id);
            if (!currentRow) return false;

            // Deep compare both rows
            // If not equal, it means some value actually changed
            return !isEqual(origRow, currentRow);
        })
        .map(origRow => origRow.id);
    // console.log('Modified rows:', modifiedRowIds);


    const handleSort = (columnKey) => {
        // Determine new sort order
        let newOrder;
        if (_sortKey !== columnKey) {
            newOrder = 'asc'; // First click on new column = ascending
        } else if (_sortOrder === 'asc') {
            newOrder = 'desc'; // Second click = descending
        } else {
            newOrder = 'asc'; // Third click = ascending again
        }

        // Update sort states
        _setSortKey(columnKey);
        _setSortOrder(newOrder);

        // Apply sorting to current data
        const sortedData = [..._data].sort((a, b) => {
            const aValue = a[columnKey];
            const bValue = b[columnKey];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Handle different data types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // String comparison
            const aString = String(aValue).toLowerCase();
            const bString = String(bValue).toLowerCase();

            if (aString < bString) return newOrder === 'asc' ? -1 : 1;
            if (aString > bString) return newOrder === 'asc' ? 1 : -1;
            return 0;
        });

        _setData(sortedData);
    };

    const handleCellClick = ({ rowIndex, columnKey, row, column }) => {

        // console.log('Cell clicked:', columnKey, rowIndex,);
        // console.log('Row data:', row);
        // console.log('Column data:', column);

        if (editableInline && !nonEditables.includes(columnKey)) {
            //  if already editing same cell, do nothing
            if (_editingCell === `$${columnKey}-${rowIndex}`) return;
            _setEditingCell(`$${columnKey}-${rowIndex}`);
            _setEditingItem(row);
        }

    };

    const handleCellChange = (rowIndex, columnKey, newValue) => {
        // console.log('Cell change:', rowIndex, columnKey, newValue);
        const updatedData = [..._data];
        updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            [columnKey]: newValue
        };
        _setData(updatedData);
        onChange(updatedData);
    };
    const handleRowChangeDismiss = (row) => {
        // console.log('Row change dismissed:', row);
        // add back from _originalData
        const originalRow = _originalData.find(r => r.id === row.id);
        if (originalRow) {
            const updatedData = [..._data];
            updatedData[_data.findIndex(r => r.id === row.id)] = originalRow;
            _setData(updatedData);
        }
    };
    const handleActionEdit = (row) => {
        // console.log('Edit action clicked for row:', row);
        _setEditingItemMain(row);
    };
    const handleActionDelete = (row) => {
        // console.log('Delete action clicked for row:', row);
        _setDeletingItem(row);
    };
    const handleActionPublish = (row) => {

    };

    const handleAddNew = () => {
        const emptyRow = {};
        _columns.forEach(col => {
            if (col.multiple) {
                emptyRow[col.key] = col.defaultValue || [];
            } else {
                emptyRow[col.key] = col.defaultValue || '';
            }
        });
        // console.log('emptyRow: ', emptyRow);

        _setNewItem(emptyRow);
        newItemChange(emptyRow);
    };

    const handleActionPreview = (row) => {
        _setPreviewItem(row);
    };

    const handleModalClose = () => {
        _setEditingItemMain(null);
        _setDeletingItem(null);
        _setNewItem(null);
        newItemChange(null);
    }

    const handleBulkSelect = (id) => {
        _setBulkSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleSelectAll = () => {
        if (_bulkSelectedIds.length === _data.length) {
            _setBulkSelectedIds([]);
        } else {
            _setBulkSelectedIds(_data.map(row => row.id));
        }
    };

    const handleBulkDelete = async () => {
        try {
            _setIsActionLoading(true);
            const fullBulkItems = _data.filter(item => _bulkSelectedIds.includes(item.id));
            const response = await onBulkAction({ action: 'delete', items: fullBulkItems });
            if (!response || !response.success) {
                notify({ type: 'error', message: response?.message || 'Error deleting items' });
                return;
            }
            _setBulkSelectedIds([]);
            _setDeletingBulkItems(false);
            notify({ type: 'success', message: `${_bulkSelectedIds.length} items deleted successfully` });
        } catch (error) {
            console.error('Bulk delete error:', error);
            notify({ type: 'error', message: 'Error deleting items' });
        } finally {
            _setIsActionLoading(false);
        }
    };


    const getFormBuilderRenderOrder = () => {
        // console.log('getFormBuilderRenderOrder editRenderOrder ==> ', editRenderOrder);
        const keys = _columns.map(col => col.key)
            .filter(k => !k);

        // Find keys that are NOT present in ANY of the editRenderOrder arrays
        const missingKeys = keys.filter(key =>
            !nonEditables.includes(key) &&
            !editRenderOrder.some(arr => arr && arr.includes(key))
        );

        // Convert missing keys to arrays and add to the result
        const arr = [
            ...editRenderOrder,
            ...missingKeys.map(key => [key])
        ];

        // console.log('getFormBuilderRenderOrder missingKeys ==> ', missingKeys);
        // console.log('getFormBuilderRenderOrder ==> ', arr);

        return arr;
    }



    const handleRowSave = async (row) => {
        try {
            let response = null
            // console.log('Row save row:', row);

            _setIsActionLoading(true);
            const func = _newItem ? onAddNew : onRowChange;
            const d = cloneDeep(row);
            // console.log('Row save d:', d);


            response = await func(d);


            if (!response || !response.success) {
                notify({ type: 'error', message: response && response.message ? response.message : 'Error saving row' });
                return;
            } else {
                // notify({ type: 'success', message: 'Done' });
                _setNewItem(null);
                _setEditingItemMain(null);
                _setDeletingItem(null);
                newItemChange(null);
            }

        } catch (error) {
            console.error('Row save error:', error);
        } finally {
            _setIsActionLoading(false);
        }

        // Here you would typically send the updated row data to your server or state management
    };
    const handleRowDelete = async (row) => {
        try {
            _setIsActionLoading(true);
            const response = await onRowDelete(row);
            if (!response || !response.success) {
                notify({ type: 'error', message: response && response.message ? response.message : 'Error deleting row' });
                return;
            }
            _setDeletingItem(null);

            notify({ type: 'success', message: 'Row deleted successfully' });
        } catch (error) {
            console.error('Row delete error:', error);
        } finally {
            _setIsActionLoading(false);
        }
    };



    const handleFilterChange = (filters) => {
        // console.log('Filters changed:', filters);
        onFilter(filters);
    };

    // Calculate minimum table width based on column widths
    const calculateMinWidth = () => {

        let totalWidth = 0;
        _columns.forEach(col => {
            totalWidth += widthMap[col.width] || 150; // default 150px if no width specified
        });

        // Add space for actions column if present
        if (actions && actions.length > 0) {
            totalWidth += 120; // 120px for actions column
        }

        // Add padding and borders
        totalWidth += 32; // extra padding

        return totalWidth;
    };
    const minTableWidth = calculateMinWidth();



    const getCellVal = (key, column, row) => {
        try {
            // console.log('key: ', key, column.options);

            if (column.options && column.options.length > 0) {
                const option = column.options.find(opt => opt.value === row[key]);
                if (option) {
                    return option.label || option.label
                }
            }

            return typeof row[key] === 'string'
                ? row[key]
                : JSON.stringify(row[key]);

            // const val = row[key];
            // return typeof val === 'string' ? val : JSON.stringify(val);
        } catch (error) {
            console.error('Error getting cell value:', error);
            return 'errored';
        }
    };
    const getPlcHolder = (col) => {
        let v = '';
        if (!v) {
            if (col.title) {
                v = `Enter ${col.title.toLowerCase()}...`;
            } else if (col.key) {
                v = `Enter ${col.key.toLowerCase()}...`;
            } else {
                v = '';
            }
        }
        return v;
    };

    const handlePageChange = (key, val) => {
        let newPage = { ..._page };
        newPage[key] = val;

        if (key === 'itemsPerPage') {
            newPage.skip = 0;
            newPage.take = val;
        }
        _setPage(newPage);
        onPageChange(newPage);
    };
    const getPaginationInfo = (thisPage = _page) => {
        // calculate number of pages
        const totalPages = Math.ceil(thisPage.total / thisPage.itemsPerPage) || 1;

        const result = {
            total: totalPages,
        }
        // console.log('getPaginationInfo thisPage: ', thisPage);
        // console.log('getPaginationInfo result: ', result);
        return result;
    };




    // search, sort, data change
    useEffect(() => {
        const body = () => {
            try {
                // console.log('sort: ');

                let filteredData = data;

                // Apply search filter
                if (searchTerm) {
                    filteredData = filteredData.filter(item =>
                        Object.values(item).some(value =>
                            String(value).toLowerCase().includes(searchTerm.toLowerCase())
                        )
                    );
                }

                // Apply current sorting if any column is sorted
                if (_sortKey) {
                    filteredData = [...filteredData].sort((a, b) => {
                        const aValue = a[_sortKey];
                        const bValue = b[_sortKey];

                        if (aValue == null && bValue == null) return 0;
                        if (aValue == null) return 1;
                        if (bValue == null) return -1;

                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return _sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                        }

                        const aString = String(aValue).toLowerCase();
                        const bString = String(bValue).toLowerCase();

                        if (aString < bString) return _sortOrder === 'asc' ? -1 : 1;
                        if (aString > bString) return _sortOrder === 'asc' ? 1 : -1;
                        return 0;
                    });
                }

                // _setData(filteredData);
            } catch (error) {
                console.error('Error in data processing:', error);
            }
        }
        if (data && data.length > 0) {
            body();
        }
    }, [searchTerm, data, _sortKey, _sortOrder]);

    // if _editingItem and _editingCell are set, then if click outside, clear them
    // excluding the same cell clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (_editingCell) {
                const cellElement = document.querySelector(`[data-cellid="${_editingCell}"]`);
                if (cellElement && !cellElement.contains(event.target)) {
                    // clicked outside the editing cell
                    _setEditingCell(null);
                    _setEditingItem(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [_editingItem, _editingCell]);
    // console.log('Table columns:', columns);

    // update original data if data prop changes

    useEffect(() => {
        if (!isEqual(data, _originalData)) {
            _setOriginalData(data);
            _setData(data || []);
        }
    }, [data]);

    // update on columns change
    useEffect(() => {
        if (!isEqual(columns, _columns)) {
            _setColumns(getCols());
        }
    }, [columns]);

    // update page if page prop changes
    useEffect(() => {
        if (page.total != _page.total) {
            let newPage = { ..._page };
            newPage.total = page.total;
            _setPage(newPage);
        }
    }, [page.total]);




    // console.log('Table _editingItem: ', _editingItem);
    // // console.log('Table _editingCell: ', _editingCell);
    // console.log('Table _newItem: ', _newItem);
    // console.log('Table _columns: ', _columns);

    return (
        <div className={`cs-table ${className} `}>
            {/* header */}
            <div className='w-full h-11 flex justify-end items-start mb-1'>

                {/* new and filters */}
                <div className='h-12 flex flex-1  items-center'>
                    {
                        onAddNew && <button
                            className='btn btn-secondary flex items-center'
                            onClick={onAddNew}
                        >
                            <PlusIcon className='size-4 mr-2' />
                            Add New
                        </button>
                    }
                    {
                        _bulkSelectedIds.length > 0 && editable && <button
                            className='btn btn-danger flex items-center ml-3'
                            onClick={() => _setDeletingBulkItems(true)}
                        >
                            <Trash2 className='size-4 mr-2' />
                            Delete ({_bulkSelectedIds.length})
                        </button>
                    }
                    {/* filters */}
                    {filterable &&
                        <FilterAndViews
                            className="w-full flex-1 mx-3"
                            account={account}
                            user={user}
                            data={data}
                            pathname={pathname}
                            columns={columns}
                            onChange={handleFilterChange}
                        />
                    }

                </div>

                {/* select, search */}
                <div className='flex flex-shrink-0 gap-5 justify-end'>
                    {/* items per page */}
                    {paginated && _page.total > 10 &&
                        <div className=''>
                            {/* <span className='text-[14px] text-gray-500'>Items per page </span> */}
                            <select
                                name='itemsPerPage'
                                className={cn(
                                    paginated ? 'block' : 'hidden',
                                    'w-full h-8 rounded-md border border-gray-300 focus:outline-none'
                                )}
                                value={_page.itemsPerPage}
                                onChange={(e) => {
                                    const newItemsPerPage = parseInt(e.target.value, 10);
                                    handlePageChange('itemsPerPage', newItemsPerPage);
                                }}
                            >
                                {itemsPerPageOptions.map(option => (
                                    <option key={option} value={option}>{option} per page</option>
                                ))}
                            </select>
                        </div>
                    }
                    {
                        searchable && (
                            <div>
                                {/* <span className='text-[14px] text-gray-500'>Search </span> */}
                                <div className='w-60 h-8 relative form-control flex items-center gap-2 '>
                                    <Search className='size-4 text-gray-300' />
                                    <input
                                        type='text'
                                        placeholder='Search...'
                                        className='focus:ring-0 focus:outline-none '
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
            {/* table */}
            <div className='overflow-x-auto  border rounded-lg slick-scrollbar border-gray-200'>
                <table className='table-fixed' style={{ minWidth: `${minTableWidth}px`, width: '100%' }}>
                    <thead className='border-b border-gray-200 bg-gray-50'>
                        <tr content=''>
                            {onBulkAction && editable && actions && actions.length > 0 &&
                                <th className='w-10'>
                                    <div className='w-10 px-2 py-2 flex justify-center items-center'>
                                        <input
                                            type='checkbox'
                                            className='w-4 h-4 cursor-pointer accent-blue-500'
                                            checked={_data.length > 0 && _bulkSelectedIds.length === _data.length}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </th>
                            }
                            {editable && actions && actions.length > 0 &&
                                <th className='w-32'>
                                    <div className='w-32 px-2 py-2 text-sm font-medium text-gray-500 flex justify-start'>
                                        Actions
                                    </div>
                                </th>
                            }

                            {_columns.map((column) => (
                                <th key={column.key} className={`${column.width || ''} px-2 py-2 text-left text-sm font-medium text-gray-500`}>
                                    <div className={`flex items-center gap-2 ${column.width || ''}`}>
                                        <span className='text-nowrap'>
                                            {column.title}
                                        </span>
                                        {sortable && <button onClick={() => handleSort(column.key)}>
                                            {_sortKey === column.key ? (
                                                _sortOrder === 'asc' ? (
                                                    <ChevronUp className="w-4 h-4 inline-block text-gray-900 transition-all duration-300" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 inline-block text-gray-900 transition-all duration-300" />
                                                )
                                            ) : (
                                                <ChevronDown className="w-4 h-4 inline-block text-gray-400 transition-all duration-300" />
                                            )}
                                        </button>}
                                    </div>
                                </th>
                            ))}

                        </tr>
                    </thead>
                    <tbody className=''>
                        {_data.map((row, rowIndex) => {
                            const isModified = modifiedRowIds.includes(row.id);
                            // console.log('isModified', isModified, modifiedRowIds, modifiedRowIds);


                            return (
                                <tr key={rowIndex} className={`
                                border-b border-gray-200 ${isModified ? 'bg-yellow-100' : ''}
                                ${row.disabled && 'opacity-55'}
                                `}>

                                    {/* checkbox */}
                                    {onBulkAction && editable && actions && actions.length > 0 && !row.disabled &&
                                        <td className='w-10'>
                                            <div className='w-10 flex justify-center items-center'>
                                                <input
                                                    type='checkbox'
                                                    className='w-4 h-4 cursor-pointer rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-0'
                                                    checked={_bulkSelectedIds.includes(row.id)}
                                                    onChange={() => handleBulkSelect(row.id)}
                                                />
                                            </div>
                                        </td>
                                    }

                                    {/* actions */}
                                    {editable && actions && actions.length > 0 && !row.disabled && editable &&
                                        <td className='w-32'>
                                            <div className='w-32 flex items-center gap-3 justify-start ml-2'>
                                                {!isModified && actions && actions.length > 0 &&
                                                    actions.map((action, aIdx) => {
                                                        if (row.status === 'published') {
                                                            return null;
                                                        }
                                                        const otherProps = {};
                                                        let actionObj = typeof action === 'string' ? {
                                                            name: action,
                                                            Icon: Pencil,
                                                            func: () => { },
                                                        } : action;

                                                        let Icon = actionObj.Icon || Pencil;
                                                        let Comp = 'button';

                                                        let tooltipText = actionObj.tooltipText || actionObj.name.charAt(0).toUpperCase() + actionObj.name.slice(1);
                                                        if (actionObj.name === 'edit') Icon = Edit2;
                                                        if (actionObj.name === 'delete') Icon = Trash;
                                                        if (actionObj.name === 'preview') Icon = Eye;
                                                        if (actionObj.name === 'edit' && !actionObj.onlyCallback) {
                                                            actionObj.func = handleActionEdit;
                                                        }

                                                        return (
                                                            <Comp
                                                                disabled={_isActionLoading || row.status === 'published'}
                                                                key={aIdx}
                                                                onClick={() => {
                                                                    if (actionObj.confirm) {
                                                                        _setConfirmingItem({
                                                                            ...actionObj,
                                                                            data: row,
                                                                        });
                                                                    } else {
                                                                        actionObj.func && actionObj.func(row);
                                                                    }
                                                                }}
                                                                className='p-1.5 bg-gray-200 border border-gray-100 rounded-md hover:bg-gray-300 transition-colors relative group'
                                                                {...otherProps}
                                                            >
                                                                <Icon className={`size-4 ${actionObj.name === 'delete' ? 'text-red-500' : 'text-gray-500'}`} />
                                                                <Tooltip
                                                                    text={tooltipText}
                                                                />
                                                            </Comp>
                                                        )
                                                    })
                                                }

                                                {
                                                    isModified &&
                                                    <div className='flex items-center gap-3'>
                                                        <button
                                                            className='p-1.5 border border-gray-500 rounded-full transition-colors hover:bg-gray-100'
                                                            onClick={() => {
                                                                handleRowChangeDismiss(row);
                                                            }}
                                                        >
                                                            <X className='size-4 text-gray-500' />
                                                        </button>

                                                        <button
                                                            className='p-1.5 border border-gray-500 rounded-full transition-colors hover:bg-gray-100'
                                                            onClick={() => {
                                                                handleRowSave(row);
                                                            }}
                                                        >
                                                            <Check className='size-4 text-gray-500' />
                                                        </button>

                                                    </div>
                                                }
                                            </div>
                                        </td>
                                    }

                                    {/* body cells */}
                                    {_columns.map((column) => {


                                        const cellId = `$${column.key}-${rowIndex}`;
                                        const isEditMode = _editingCell === cellId;

                                        const ColComponent = column.Component || null;
                                        const CellContainer = editableInline && !nonEditables.includes(column.key) && !isEditMode
                                            ? 'button'
                                            : 'div'

                                        const EditComponent = column.EditComponent && column.EditComponent !== 'default'
                                            ? column.EditComponent
                                            : null;

                                        // console.log('EditComponent ==> ', EditComponent, column.EditComponent);
                                        let val = row[column.key];

                                        if (['due_date', 'date', 'created_at', 'updated_at'].includes(column.key)) {
                                            val = new Date(val).toLocaleDateString();
                                        }
                                        if (Array.isArray(val)) {
                                            val = val.join(', ');
                                        }

                                        // console.log('table -  row-edit val: ', val);
                                        if (typeof val === 'object' && val !== null) {
                                            // val = 'bbb';
                                            val = JSON.stringify(val);
                                        }
                                        return (
                                            <td key={column.key} className={`${column.width || ''}`}>
                                                <CellContainer
                                                    data-cellid={cellId}
                                                    className={` h-10 
                                                        px-2 py-2 text-sm text-gray-700 ${column.width || ''} 
                                                        ${isEditMode ? 'overflow-visible' : 'overflow-hidden'} whitespace-nowrap text-ellipsis
                                                        flex items-center justify-start
                                                        transition-all duration-300 ease-in-out
                                                        ${isEditMode ? 'relative z-10 bg-blue-100 ' : ''}
                                                        `}
                                                    onClick={() => {
                                                        if (CellContainer !== 'button') return;
                                                        handleCellClick({
                                                            rowIndex,
                                                            columnKey: column.key,
                                                            row,
                                                            column,
                                                        });
                                                    }}
                                                >
                                                    {
                                                        !isEditMode && <>
                                                            {
                                                                ColComponent ? (
                                                                    <ColComponent
                                                                        value={row[column.key]}
                                                                        row={row} rowIndex={rowIndex} column={column}
                                                                        users={users} leads={leads}
                                                                    />
                                                                ) : column.type === 'date'
                                                                    ? <DateDisplay date={row[column.key]} format="short" className="text-gray-700" />
                                                                    : <>{getCellVal(column.key, column, row)}</>
                                                            }
                                                        </>
                                                    }
                                                    {
                                                        isEditMode && <div className={``}>
                                                            {
                                                                (ColComponent && EditComponent) && !isEditMode ? (
                                                                    EditComponent
                                                                        ? <EditComponent
                                                                            value={row[column.key]}
                                                                            row={row}
                                                                            rowIndex={rowIndex} column={column}
                                                                            onChange={(newValue) => handleCellChange(rowIndex, column.key, newValue)}
                                                                            users={users} leads={leads}
                                                                        />
                                                                        : <ColComponent value={row[column.key]} row={row} rowIndex={rowIndex} column={column} />
                                                                ) : column.type === 'select' ? (
                                                                    <Select
                                                                        value={row[column.key] || (column.multiple ? [] : '')}
                                                                        onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                        options={column.options || []}
                                                                        placeholder="Select..."
                                                                        searchable={column.searchable || false}
                                                                        clearable={column.clearable || false}
                                                                        multiple={column.multiple || false}
                                                                        className="min-w-32"
                                                                    />
                                                                ) : column.type === 'date' || column.type === 'datetime' ? (
                                                                    <div className='w-full'>
                                                                        <DateInput
                                                                            value={row[column.key] || ''}
                                                                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                            placeholder="Select date..."
                                                                            showTime={column.type === 'datetime' || column.showTime}
                                                                            format={column.format}
                                                                            inline={true}
                                                                        />

                                                                    </div>
                                                                ) : (
                                                                    <div className='w-10/12 mx-1 p-0.5 text-sm border border-gray-300 rounded '>
                                                                        <input
                                                                            type={['email', 'number', 'text', 'password'].includes(column.type)
                                                                                ? column.type
                                                                                : 'text'
                                                                            }
                                                                            name={column.key}
                                                                            className='focus:right-0 focus:outline-none w-full'
                                                                            value={row[column.key]}
                                                                            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
                                                                        />
                                                                    </div>
                                                                )
                                                            }
                                                        </div>
                                                    }

                                                </CellContainer>

                                                {/* space holder */}
                                                {/* <div className='h-4 w-full flex-shrink'></div> */}
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {
                    _data.length === 0 &&
                    <div className='p-4 text-center text-gray-500'>
                        No data available
                    </div>
                }
            </div>

            {/* pagination */}
            <div className='w-full my-2 flex items-center justify-end gap-1' >
                {paginated && getPaginationInfo().total > 1 && (() => {
                    const totalPages = getPaginationInfo().total;
                    const currentPage = (_page.skip / _page.itemsPerPage) + 1;
                    const pages = [];

                    // Previous button
                    pages.push(
                        <button
                            key="prev"
                            onClick={() => handlePageChange('skip', Math.max(0, _page.skip - _page.itemsPerPage))}
                            disabled={currentPage === 1}
                            className={cn(
                                'px-1.5 py-0.5 rounded-md border border-gray-300',
                                currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <ChevronLeft className="w-4 " />
                        </button>
                    );

                    // Always show first page
                    pages.push(
                        <button
                            key={1}
                            onClick={() => handlePageChange('skip', 0)}
                            className={cn(
                                'px-2 py-0.5 rounded-md border border-gray-300',
                                currentPage === 1
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            1
                        </button>
                    );

                    // Show dots if current page is far from start
                    if (currentPage > 3) {
                        pages.push(
                            <span key="dots-start" className="px-2 text-gray-500">...</span>
                        );
                    }

                    // Show pages around current page
                    const startPage = Math.max(2, currentPage - 1);
                    const endPage = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                            <button
                                key={i}
                                onClick={() => handlePageChange('skip', (i - 1) * _page.itemsPerPage)}
                                className={cn(
                                    'px-2 py-0.5 rounded-md border border-gray-300',
                                    currentPage === i
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                {i}
                            </button>
                        );
                    }

                    // Show dots if current page is far from end
                    if (currentPage < totalPages - 2) {
                        pages.push(
                            <span key="dots-end" className="px-2 text-gray-500">...</span>
                        );
                    }

                    // Always show last page (if more than 1 page)
                    if (totalPages > 1) {
                        pages.push(
                            <button
                                key={totalPages}
                                onClick={() => handlePageChange('skip', (totalPages - 1) * _page.itemsPerPage)}
                                className={cn(
                                    'px-2 py-0.5 rounded-md border border-gray-300',
                                    currentPage === totalPages
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                {totalPages}
                            </button>
                        );
                    }

                    // Next button
                    pages.push(
                        <button
                            key="next"
                            onClick={() => handlePageChange('skip', Math.min((totalPages - 1) * _page.itemsPerPage, _page.skip + _page.itemsPerPage))}
                            disabled={currentPage === totalPages}
                            className={cn(
                                'px-1.5 py-0.5 rounded-md border border-gray-300',
                                currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <ChevronRight className="w-4 " />
                        </button>
                    );

                    return pages;
                })()}
            </div>

            {
                _confirmingItem && (
                    <Modal
                        isOpen={true}
                        onClose={() => _setConfirmingItem(null)}
                    >
                        {
                            _confirmingItem.ConfirmComponent
                                ? <_confirmingItem.ConfirmComponent
                                    data={_confirmingItem.data}
                                    // onChange={(data) => {
                                    //     console.log('_confirmingItem.ConfirmComponent data: ', data);
                                    //     _setConfirmingItem({ ..._confirmingItem, data });
                                    // }}
                                    onClose={() => _setConfirmingItem(null)}
                                />
                                : <>
                                    <div className='p-4'>
                                        <h2 className='text-lg font-semibold mb-2'>
                                            {_confirmingItem?.confirm.title || 'Confirm'}
                                        </h2>
                                        <p>{_confirmingItem?.confirm.message || 'Are you sure you want to delete this item?'}</p>
                                    </div>
                                    <div className='flex justify-end p-4'>
                                        <button
                                            className='btn btn-primary '
                                            onClick={() => {
                                                // handleRowDelete(_deletingItem);
                                                _setConfirmingItem(null)
                                            }}
                                        >
                                            {_confirmingItem?.confirm.button1 || 'Cancel'}
                                        </button>
                                        <button
                                            className={cn(
                                                'btn ml-2',
                                                _confirmingItem.name.includes('delete') ? 'btn-danger' : 'btn-secondary '
                                            )}
                                            onClick={() => {
                                                if (_confirmingItem.func) {
                                                    _confirmingItem.func(_confirmingItem.data);
                                                    _setConfirmingItem(null);
                                                }
                                            }}
                                        >
                                            {_confirmingItem?.confirm.button2 || 'Confirm'}
                                        </button>
                                    </div>
                                </>
                        }

                        {_isActionLoading && <div className='animate-shimmer'></div>}

                    </Modal>
                )
            }
            {
                _previewItem && (
                    <Modal
                        isOpen={true}
                        title={`Preview  ${_previewItem.name || _previewItem.title || 'Content'}`}
                        onClose={() => _setPreviewItem(null)}
                        className="w-10/12 md:w-[600px]"
                    >
                        <div className='p-4 flex flex-col gap-4'>
                            {(() => {
                                const content = _previewItem[previewKey] || '';
                                const isHTML = /<[a-z][\s\S]*>/i.test(content);

                                if (isHTML) {
                                    return (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Eye className="w-5 h-5 text-blue-500" />
                                                <span className="font-medium">HTML Preview:</span>
                                            </div>
                                            <iframe
                                                srcDoc={content}
                                                className="w-full h-96 border border-gray-300 rounded-md"
                                                title="Content Preview"
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Eye className="w-5 h-5 text-green-500" />
                                                <span className="font-medium">Text Preview:</span>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto slick-scrollbar">
                                                <div className="whitespace-pre-wrap text-gray-800 text-sm">
                                                    {content || 'No content available'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button
                                    onClick={() => _setPreviewItem(null)}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {_deletingBulkItems &&
                <Modal
                    isOpen={true}
                    onClose={() => _setDeletingBulkItems(false)}
                >
                    <div className='p-4'>
                        <h2 className='text-lg font-semibold mb-2'>Confirm Bulk Delete</h2>
                        <p>Are you sure you want to delete {_bulkSelectedIds.length} selected item{_bulkSelectedIds.length > 1 ? 's' : ''}?</p>
                    </div>
                    <div className='flex justify-end p-4 gap-2'>
                        <button
                            className='btn btn-primary'
                            onClick={() => _setDeletingBulkItems(false)}
                            disabled={_isActionLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className='btn btn-danger'
                            onClick={handleBulkDelete}
                            disabled={_isActionLoading}
                        >
                            {_isActionLoading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </Modal>
            }

            {(_editingItemMain || _newItem) &&
                <Modal
                    isOpen={true}
                    title={`${_newItem ? 'New' : 'Edit'} Item`}
                    // title={`Preview ${_editingItemMain ? 'Edit' : 'New'} ${itemName || 'Item'}`}
                    onClose={() => {
                        _setEditingItemMain(null);
                        _setNewItem(null);
                    }}
                    className="w-10/12 md:w-[600px]"
                >
                    <FormBuilder
                        // className={'w-full relative' + modalType === 'expandable' ? ' p-5' : ' '}
                        // className={'h-[350px] ' + (modalType === 'expandable' ? 'h-[calc(100vh-160px)] p-3' : 'h-[445px]')}
                        className={'py-6' + (modalType === 'expandable' ? 'h-[calc(100vh-160px)] p-3' : '')}
                        formData={_editingItemMain || _newItem}
                        onSubmit={(formData) => {
                            // console.log('formData: ', formData);
                            // thisModal.close();
                            handleRowSave(formData);
                        }}
                        renderOrder={getFormBuilderRenderOrder()}
                        saveButtonTop={saveButtonTop || null} // show save button at top of modal
                        isButtons={true}
                        isFixedButtons={true}
                        scrollable={true}
                        fields={[
                            ...columns.map(col => ({
                                ...col,
                                name: col.key,
                                label: col.title,
                                type: col.type || 'text',
                                options: col.options || null,
                                validateKey: col.validateKey || col.key,
                                required: col?.required || false,
                                disabled: col.disabled || false,
                                defaultValue: _newItem ? (col.defaultValue || (col.multiple ? [] : '')) : undefined,
                                multiple: col.multiple || false,
                                searchable: col.searchable || false,
                                clearable: col.clearable !== false,
                                placeholder: getPlcHolder(col),
                                showTime: col.showTime || false,
                                format: col.format || 'YYYY-MM-DD',
                                rows: col.rows || 3,
                            })).filter(f => !nonEditables.includes(f.name)),
                            ...(isUserTable ? [{
                                ...passwordField,
                                required: _newItem ? true : false
                            }] : [])
                        ]}
                        disabled={_isActionLoading}
                    />
                </Modal>
            }



        </div>
    )
}

export default Table;
