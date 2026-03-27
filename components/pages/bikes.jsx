'use client';

import { saCreateItem, saGetItems, saUpdateItem, saDeleteItem, saDeleteItems } from "@/actions";
import { notify } from "@/components/sonnar/sonnar";
import { PopupModal } from "@/components/other/modals";
import { cloneDeep } from "lodash";
import { useState, useEffect, useRef } from "react";
import FormBuilder from "@/components/formBuilder";
import Loading from "@/components/other/loading";
import Image from "next/image";
import Select from "@/components/select";
import { toDisplayNum, toDisplayStr } from "@/utils/other";
import Link from "next/link";
import { Toggle } from "@/components/other/toggle";
import Cookies from "js-cookie";
import DynamicEl from "@/components/other/dynamic";

const defaultFilters = {
    in_stock: true,
    profit_margin_percent: 40,
    sources: ['giantGroup', 'cyclingsportsgroup'],
    brands: null,
};

const getCookieValue = (key, fallback) => {
    try {
        const value = Cookies.get(key);
        return value !== undefined ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Error parsing cookie "${key}": `, error);
        return fallback;
    }
};

const getInitialFilters = () => ({
    in_stock: getCookieValue('in_stock', defaultFilters.in_stock),
    profit_margin_percent: getCookieValue('profit_margin_percent', defaultFilters.profit_margin_percent),
    sources: getCookieValue('sources', defaultFilters.sources),
    brands: getCookieValue('brands', defaultFilters.brands),
});


export default function Bikes({ pathname, user, account, session, workspace }) {
    const wId = workspace?.id || null;
    const collectionName = 'bikes';

    const availableSources = ['giantGroup', 'cyclingsportsgroup'];



    const [_isLoading, _setIsLoading] = useState(true);
    const [_data, _setData] = useState([]);
    const [_page, _setPage] = useState({
        skip: 0,
        take: 10,
        itemsPerPage: 10,
        total: 0
    });
    const [_editItem, _setEditItem] = useState(null);

    const [_availableBrands, _setAvailableBrands] = useState([]);
    const [_filters, _setFilters] = useState(() => getInitialFilters());
    const [_search, _setSearch] = useState('');
    const _searchTimer = useRef(null);

    const sourceImages = {
        'giantGroup': '/images/other/giantGroup.png',
        'cyclingsportsgroup': '/images/other/csg.png',
    }

    const mapFormattedData = (items) => {
        try {
            const newItems = [];
            items.forEach((item, index) => {
                let nt = cloneDeep(item);

                // Map SKUs to include wheel_front_rear and profit color
                if (nt.skus && nt.skus.length > 0) {
                    nt.skus = nt.skus.map(sku => {
                        const mappedSku = { ...sku };
                        mappedSku.wheel_front_rear = `${sku.wheel_size_front || 'N/A'} / ${sku.wheel_size_rear || 'N/A'}`;

                        // Calculate profit margin color
                        const threshold = _filters.profit_margin_percent;
                        const profitPercent = sku.profit_margin_percent || 0;

                        if (profitPercent >= threshold) {
                            mappedSku.profit_color = 'text-green-600 bg-green-50';
                        } else if (profitPercent >= threshold * 0.5) {
                            mappedSku.profit_color = 'text-yellow-600 bg-yellow-50';
                        } else {
                            mappedSku.profit_color = 'text-red-600 bg-red-50';
                        }

                        return mappedSku;
                    });
                }

                newItems.push(nt);
            });

            return newItems;
        } catch (error) {
            console.error('Error mapping formatted data: ', error);
            return [];
        }
    }


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
                ['skus'].forEach(relKey => {
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
                    notify({ type: 'success', message: 'Bike created successfully' });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to create bike' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to create bike';
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
                    notify({ type: 'success', message: 'Bike updated successfully' });
                    resObj.success = true;
                    resObj.data = response.data;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to update bike' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to update bike';
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
                    notify({ type: 'success', message: 'Bike deleted successfully' });
                    resObj.success = true;
                    resObj.message = 'Done';
                } else {
                    notify({ type: 'error', message: response.message || 'Failed to delete bike' });
                    resObj.success = false;
                    resObj.message = response.message || 'Failed to delete bike';
                }
            }

            return resObj;
        } catch (error) {
            console.error(`Error ${action}ing bike: `, error);
            notify({ type: 'error', message: error.message || `Failed to ${action} bike` });
            resObj.success = false;
            resObj.message = error.message || `Failed to ${action} bike`;
            resObj.data = item;
            return resObj;
        } finally {
            _setIsLoading(false);
        }
    };
    const handleSearchChange = (value) => {
        _setSearch(value);
        clearTimeout(_searchTimer.current);
        _searchTimer.current = setTimeout(() => {
            const newPage = { ..._page, skip: 0, total: 0 };
            _setPage(newPage);
            fetchData({ thisPage: newPage, filters: _filters, search: value });
        }, 400);
    };

    const fetchData = async ({
        thisPage = _page,
        append = false,
        filters = _filters,
        search = _search
    }) => {
        try {
            _setIsLoading(true);
            const inStock = typeof filters.in_stock === 'boolean' ? filters.in_stock : true;
            const skuWhere = {
                in_stock: inStock,
                ...(filters.brands && filters.brands.length > 0
                    ? {
                        brand: {
                            in: filters.brands
                        }
                    }
                    : {})
            };

            // apply profit margin filter on SKUs
            if (typeof filters.profit_margin_percent === 'number') {
                skuWhere.profit_margin_percent = {
                    gte: filters.profit_margin_percent
                };
            }
            const reqParams = {
                collection: collectionName,
                includeCount: true,
                query: {
                    where: {
                        workspace_id: workspace ? workspace.id : null,
                        // in_stock: inStock,
                        source: filters.sources && filters.sources.length > 0 ? { in: filters.sources } : undefined,
                        skus: { some: skuWhere },
                        ...(search ? {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { description: { contains: search, mode: 'insensitive' } },
                                { skus: { some: { brand: { contains: search, mode: 'insensitive' } } } },
                                { skus: { some: { item_number: { contains: search, mode: 'insensitive' } } } },
                                { skus: { some: { size: { contains: search, mode: 'insensitive' } } } },
                                { skus: { some: { wheel_size_front: { contains: search, mode: 'insensitive' } } } },
                                { skus: { some: { wheel_size_rear: { contains: search, mode: 'insensitive' } } } },
                                { skus: { some: { product_type: { contains: search, mode: 'insensitive' } } } },
                            ]
                        } : {}),
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    include: {
                        skus: {
                            where: skuWhere
                        },
                    },
                    skip: thisPage.skip,
                    take: thisPage.take,
                }
            };
            console.log('>>>>>reqParams: ', reqParams);

            const response = await saGetItems(reqParams);

            console.log(`Fetched ${collectionName}: `, response);

            if (response && response.success) {
                // Sort bikes by max profit_margin_percent of their SKUs (descending)
                let sortedData = (response.data || []).sort((a, b) => {
                    const maxProfitA = a.skus && a.skus.length > 0
                        ? Math.max(...a.skus.map(sku => sku.profit_margin_percent || 0))
                        : 0;
                    const maxProfitB = b.skus && b.skus.length > 0
                        ? Math.max(...b.skus.map(sku => sku.profit_margin_percent || 0))
                        : 0;
                    return maxProfitB - maxProfitA; // Descending order
                });

                // Append new data if loading more, otherwise replace
                if (append) {
                    _setData(prev => [...prev, ...sortedData]);
                } else {
                    _setData(sortedData);
                }
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

    const fetchAvailableBrands = async (filters = _filters) => {
        try {
            const response = await saGetItems({
                collection: 'skus',
                query: {
                    where: {
                        workspace_id: wId,
                        in_stock: typeof filters.in_stock === 'boolean' ? filters.in_stock : true,
                        source: filters.sources && filters.sources.length > 0 ? { in: filters.sources } : undefined,
                    },
                    select: {
                        brand: true,
                    },
                    distinct: ['brand'],
                    orderBy: {
                        brand: 'asc',
                    },
                },
            });

            if (response?.success) {
                const brands = (response.data || [])
                    .map(item => item?.brand)
                    .filter(Boolean);
                _setAvailableBrands(brands);
            }
        } catch (error) {
            console.error('Error fetching brands: ', error);
        }
    }
    const handlePageChange = (newPage) => {
        _setPage(newPage);
        fetchData(newPage);
    };
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

    const handleFormSubmit = async (formData) => {
        if (_editItem.id) {
            await updateItem({ item: { ..._editItem, ...formData }, action: 'update' });
        } else {
            await updateItem({ item: { ...formData }, action: 'create' });
        }
        _setEditItem(null);
    };

    const getBikeLink = (bike) => {
        try {
            if (!bike.skus || bike.skus.length === 0) return '#';
            const source = bike.source || 'unknown';
            if (source === 'giantGroup') {
                const baseUrl = 'https://giant2org.my.site.com/product-search-page?q='
                return baseUrl + bike.name;
            } else if (source === 'cyclingsportsgroup') {
                const baseUrl = 'https://b2b.cyclingsportsgroup.com/en/NA/Results.aspx?isquicksearch=1&searchkeyword='
                return baseUrl + bike.name;
            }

            return '#';
        } catch (error) {
            console.error('Error generating bike link: ', error);
            return '#';
        }
    };

    const skuKeys = [
        'item_number',
        // 'product_type',
        'size',
        // 'model',
        'model_year',
        'level',
        // 'wheel_size_front',
        // 'wheel_size_rear',
        'wheel_front_rear',
        // 'quantity',
        'normal_price',
        'consumer_price',
        'dealer_price',
        'profit_margin',
        'profit_margin_percent',
    ];

    const handleFilterChange = (filterName, value) => {
        const nextFilters = {
            ..._filters,
            [filterName]: value
        };

        _setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));

        Cookies.set(filterName, JSON.stringify(value), { expires: 7 });

        if (filterName === 'profit_margin_percent') {
            return;
        }

        if (filterName === 'in_stock' || filterName === 'sources') {
            fetchAvailableBrands(nextFilters);
        }

        // fetchData with new filters, reset to first page
        const newPage = {
            ..._page,
            skip: 0
        };
        _setPage(newPage);
        fetchData({
            thisPage: newPage,
            append: false,
            filters: nextFilters
        });
    }

    const handleLoadMore = async () => {
        const newPage = {
            ..._page,
            skip: _page.skip + _page.take
        };
        _setPage(newPage);
        await fetchData({ thisPage: newPage, append: true });
    };

    const handleItemsPerPageChange = (value) => {
        const newPage = {
            ..._page,
            take: value,
            itemsPerPage: value,
            skip: 0,
        };
        _setPage(newPage);
        fetchData({ thisPage: newPage, append: false, filters: _filters });
    };

    const refreshData = () => {
        const resetPage = { ..._page, skip: 0, total: 0 };
        _setPage(resetPage);
        _setData([]);
        fetchData({ thisPage: resetPage, append: false, filters: _filters, search: _search });
        fetchAvailableBrands(_filters);
    };


    useEffect(() => {
        fetchData({ filters: _filters });
        fetchAvailableBrands(_filters);
    }, []);



    return (
        <div className="container-main flex flex-col gap-4">

            <div className="flex items-center gap-3">
                <h1 className="text-sm font-semibold">Bikes</h1>
                <span className="text-sm text-gray-600">
                    Showing {_data.length} of {_page.total} bikes
                </span>
                <button
                    onClick={refreshData}
                    disabled={_isLoading}
                    className="btn btn-sm btn-outline ml-auto"
                >
                    {_isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            {/* header */}
            <div className="w-full h-50 flex bg-white shadow-md rounded-md border border-gray-300">
                <DynamicEl className="w-full h-50 flex">
                    <div className="w-[550px] flex flex-col items-start gap-4 p-4">
                        <div className="w-full flex items-center gap-2">
                            <span className="w-14 flex-shrink-0">Search</span>
                            <input
                                type="text"
                                value={_search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="form-control flex-1"
                                placeholder="Name, brand or item number..."
                            />
                        </div>
                        <div className="w-full flex items-center gap-2">
                            <span className="w-14 flex-shrink-0">Sources</span>
                            <Select
                                name="sources"
                                value={_filters.sources}
                                onChange={(e) => {
                                    const newSources = e?.target?.value || []
                                    // console.log('newSources: ', newSources);
                                    handleFilterChange('sources', newSources.length > 0 ? newSources : null);
                                }}
                                options={availableSources.map(src => ({ label: toDisplayStr(src), value: src }))}
                                multiple={true}
                                searchable={true}
                                clearable={true}
                                placeholder="Select sources..."
                            />
                        </div>
                        <div className="w-full flex items-center gap-2">
                            <span className="w-14 flex-shrink-0">Brands</span>
                            <Select
                                name="brands"
                                value={_filters.brands}
                                onChange={(e) => {
                                    const newBrands = e?.target?.value || [];
                                    handleFilterChange('brands', newBrands.length > 0 ? newBrands : null);
                                }}
                                options={_availableBrands.map(brand => ({ label: toDisplayStr(brand), value: brand }))}
                                multiple={true}
                                searchable={true}
                                clearable={true}
                                placeholder="Select brands..."
                            />
                        </div>
                    </div>
                    <div className="w-[250px] flex flex-col items-end gap-4 p-4">
                        <div className="flex items-center gap-2">
                            <span className="h-7">Good Profit %</span>
                            <input
                                type="number"
                                value={_filters.profit_margin_percent}
                                onChange={(e) => handleFilterChange('profit_margin_percent', parseInt(e.target.value))}
                                className="form-control w-24"
                                placeholder="Profit %"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Per page:</label>
                            <select
                                value={_page.take}
                                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                className="form-control w-24"
                            >
                                {
                                    [10, 20, 50, 100].map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))
                                }
                            </select>
                        </div>

                    </div>
                    <div className="w-96 flex flex-col items-start gap-2 p-4">
                        <div className="flex items-center gap-2 cursor-pointer">
                            <span className="h-7">In Stock</span>
                            <Toggle checked={_filters.in_stock} onChange={(val) => handleFilterChange('in_stock', val)} />
                        </div>
                    </div>
                </DynamicEl>
            </div>

            {/* data table */}
            <div className="w-full relative min-h-96 rounded-md">
                <Loading loading={_isLoading} />
                {
                    _data.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No bikes found. Click "Add Bike" to create one.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 text-">
                            {mapFormattedData(_data).map((bike) => (
                                <div key={bike.id} className="flex text-sm gap-2 border border-gray-300 rounded-md shadow-sm">
                                    <div className="w-52 p-2 flex flex-col gap-2 items-center bg-gray-100">
                                        <div className="w-full flex gap-2 p-1 items-center shadow-md rounded-md">
                                            <Image
                                                src={sourceImages[bike.source] || '/images/pther/default_source.png'}
                                                alt={bike.source}
                                                width={60}
                                                height={40}
                                                className="w-20 h-auto object-cover rounded"
                                            />
                                            <span>{bike.source}</span>
                                        </div>
                                        <div className="w-44 rounded-md mt-1">
                                            {bike.product_image && (
                                                <Image
                                                    src={bike.product_image}
                                                    alt={bike.name}
                                                    width={400}
                                                    height={160}
                                                    className="w-full h-auto object-cover rounded"
                                                />
                                            )}
                                        </div>
                                        <div className="w-full h-full">
                                            <div className="w-full mb-2 justify-between flex items-center mt-2 gap-2">

                                                <Link href={getBikeLink(bike)} target="_blank" className="underline text-blue-500">
                                                    View Details
                                                </Link>
                                            </div>
                                            <h2 className="font-bold text-start">{bike.name || 'Untitled'}</h2>
                                            <span>Skus {bike.skus.length}</span>
                                            <span>{bike.model_year}</span>

                                        </div>
                                    </div>
                                    <div className="w-full text-xs p-4 overflow-x-auto">
                                        <table className="w-full ">
                                            <thead>
                                                <tr className="border-b-2 border-gray-300 bg-gray-50">
                                                    {
                                                        skuKeys.map((key) => (
                                                            <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                                                                {toDisplayStr(key)}
                                                            </th>
                                                        ))
                                                    }
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    bike.skus.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={skuKeys.length} className="px-3 py-4 text-center text-gray-500">
                                                                No SKUs available
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        bike.skus.map((sku, index) => (
                                                            <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                                {
                                                                    skuKeys.map((key) => {

                                                                        let val = sku[key];
                                                                        if (key === 'normal_price' || key === 'consumer_price' || key === 'dealer_price' || key === 'profit_margin') {
                                                                            val = `$${toDisplayNum(val)}`;
                                                                        } else if (key === 'profit_margin_percent') {
                                                                            val = `${toDisplayNum(val)}%`;
                                                                        } else if (key === 'wheel_front_rear') {
                                                                            val = `${sku.wheel_size_front || 'N/A'} / ${sku.wheel_size_rear || 'N/A'}`;
                                                                        } else if (typeof val === 'boolean') {
                                                                            val = val ? 'Yes' : 'No';
                                                                        } else if (key === 'item_number') {
                                                                            val = val;
                                                                        } else {
                                                                            val = toDisplayStr(val);
                                                                        }
                                                                        return (
                                                                            <td key={key} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                                <span className={`inline-block max-w-[120px] truncate ${key === 'profit_margin_percent' && sku.profit_color ? sku.profit_color + ' px-2 py-1 rounded font-semibold' : ''}`}>
                                                                                    {val}
                                                                                </span>
                                                                            </td>
                                                                        )
                                                                    })
                                                                }
                                                            </tr>
                                                        ))
                                                    )
                                                }
                                            </tbody>
                                        </table>
                                    </div>


                                    {/* <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditSubmit(bike)}
                                            className="btn btn-sm btn-outline flex-1"
                                            disabled={_isLoading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => updateItem({ item: bike, action: 'delete' })}
                                            className="btn btn-sm btn-error flex-1"
                                            disabled={_isLoading}
                                        >
                                            Delete
                                        </button>
                                    </div> */}
                                </div>
                            ))}

                            {/* Load More Button */}
                            {_data.length < _page.total && (
                                <div className="flex justify-center mt-6 mb-4">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={_isLoading}
                                        className="btn btn-primary"
                                    >
                                        {_isLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }

                <div className="h-20 md:h-40"></div>
            </div>

            {_editItem && <PopupModal isOpen={true} onClose={() => _setEditItem(null)}>
                <div className="flex flex-col gap-4">
                    <FormBuilder
                        formData={_editItem}
                        onSubmit={handleFormSubmit}
                        fields={[
                            {
                                name: 'name',
                                label: 'Name',
                                type: 'text',
                                required: true,
                            },
                            {
                                name: 'description',
                                label: 'Description',
                                type: 'textarea',
                                rows: 3,
                            },
                            {
                                name: 'product_image',
                                label: 'Product Image URL',
                                type: 'text',
                            },
                            {
                                name: 'in_stock',
                                label: 'In Stock',
                                type: 'toggle',
                            }
                        ]}
                    />
                </div>
            </PopupModal>}

        </div>
    );
}
