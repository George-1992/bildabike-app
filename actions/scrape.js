'use server';
import fs from 'fs';
import Prisma from "@/services/prisma";
import { cyclingSportsGroup } from '@/utils/scrapeFunctions/cyclingsportsgroup';
import { giantGroup } from '@/utils/scrapeFunctions/giantGroup';
import { appConsole } from '@/utils/logger';
import { browserless, getFuncBody } from '@/utils/browserless';
// import dummyData from "../result_pre_cyclingsportsgroup_1774635040215.json";

const IS_DEV = process.env.NODE_ENV !== 'production';

const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

const GG_USERNAME = process.env.GG_USERNAME || '';
const GG_PASSWORD = process.env.GG_PASSWORD || '';

const CCG_USERNAME = process.env.CCG_USERNAME || '';
const CCG_PASSWORD = process.env.CCG_PASSWORD || '';

const QBP_USERNAME = process.env.QBP_USERNAME || '';
const QBP_PASSWORD = process.env.QBP_PASSWORD || '';



// utils
// ============================
const getProfitMargin = (item) => {
    try {
        // Handle both object with a/b properties and legacy properties
        let a = item.a || item.consumer_price || item.consumerPrice || 0;
        let b = item.b || item.dealer_price || item.dealerPrice || 0;

        if (!b) {
            b = item.normal_price || item.normalPrice || 0;
        }

        if (a === 0 || b === 0) {
            return {
                profit_margin: 0,
                profit_margin_percent: 0
            };
        }

        const margin = a - b;
        const percent = b > 0 ? parseFloat(((margin / a) * 100).toFixed(2)) : 0;

        return {
            profit_margin: margin,
            profit_margin_percent: percent
        };
    } catch (error) {
        console.error('Error calculating profit margin for item:', item, error);
        return {
            profit_margin: 0,
            profit_margin_percent: 0
        };
    }
};
const formatData = ({ data, source }) => {
    try {
        let newData = [];

        if (!data) {
            console.warn('formatData >>> Data is not an array, returning [] data');
            return [];
        }


        if (source === 'giantGroup') {
            if (!Array.isArray(data)) {
                console.warn('formatData >>> Data is not an array for giantGroup, returning [] data');
                return [];
            }
            for (const item of (data && Array.isArray(data)) ? data : []) {

                const rdata = item?.response?.data?.returnValue;

                // console.log('rdata >>>>>>>: ', {
                //     url: item.url,
                //     payload: item.request
                //         ? item.request.payload
                //         : 'No request payload',
                //     rdata: rdata ? (Array.isArray(rdata) ? `Array of length ${rdata.length}` : 'Not an array') : 'No returnValue',
                // });


                if (rdata && Array.isArray(rdata)) {


                    for (const returnValue of rdata) {
                        const skus = returnValue?.skus;
                        if (!skus || !Array.isArray(skus)) {
                            console.warn('SKUs is not an array for item, skipping item:');
                            continue;
                        }

                        let obj = {
                            id: returnValue.id || "",
                            name: returnValue.name || "",
                            source: source || "",
                            in_stock: returnValue.inStock || false,
                            product_image: returnValue.productImageUrl || "",
                            record_url: returnValue.recordUrl || "",
                            skus: []
                        }


                        // add skus
                        if (returnValue.skus && Array.isArray(returnValue.skus)) {
                            for (const sku of returnValue.skus) {

                                // console.log('profit_margin: ', getProfitMargin(sku));

                                obj.skus.push({
                                    id: sku.id || "",
                                    name: sku.name || "",
                                    source: source || "",
                                    brand: sku.brand || "",
                                    product_type: sku.productType || "",
                                    quantity: sku.quantity || 0,
                                    size: sku.size || "",
                                    wheel_size_front: sku.wheelSizeFront || "",
                                    wheel_size_rear: sku.wheelSizeRear || "",

                                    normal_price: sku.normalPrice || 0,
                                    consumer_price: sku.consumerPrice || 0,
                                    dealer_price: sku.dealerPrice || 0,
                                    ...getProfitMargin(sku),
                                    record_url: sku.recordUrl || "",

                                    in_stock: sku.inStock || false,
                                    item_group_name: sku.itemGroupName || "",
                                    item_number: sku.itemNumber || "",
                                    level: sku.level || "",
                                    model: sku.model || "",
                                    model_series_name: sku.modelSeriesName || "",
                                    model_year: sku.modelYear || "",
                                });
                            }
                        }

                        newData.push(obj);
                    }
                }
            }

        }

        if (source === 'cyclingsportsgroup') {

            const sourceItems = data?.items || [];
            const items = [];
            const allVariantItems = data?.variantItems || [];

            // console.log('>>> formatData sourceItems: ', sourceItems?.length || 0);
            // console.log('>>> formatData allVariantItems: ', allVariantItems?.length || 0);
            // console.log('>>> formatData sourceItems[0]: ', sourceItems[0]);


            for (const item of sourceItems) {
                const bike = {}
                bike.id = item?.['Id'] || "";
                bike.name = item?.['DisplayName'] || "";
                bike.source = source || "";
                bike.in_stock = item?.['InStock'] || false;
                bike.product_image = item?.['ImageUrl'] || "";
                bike.skus = []

                // loop over item.Variants and find matching from
                //  allVariantItems by id, then merge the data
                if (item?.Variants && Array.isArray(item.Variants)) {
                    for (const sku of item.Variants) {
                        const matchedVariant = allVariantItems.find(variant => variant['Number'] === sku['VariantId']);
                        if (matchedVariant) {
                            let sd = {
                                id: matchedVariant.VariantId || matchedVariant.Number || "",
                                name: matchedVariant.Name || matchedVariant.DisplayName || matchedVariant.ItemDescription || "",
                                source: source || "",
                                in_stock: item?.['InStock'] || matchedVariant.InStock || false,
                                record_url: matchedVariant.RecordUrl || matchedVariant.recordUrl || "",
                                item_number: matchedVariant.Number || matchedVariant.ItemNumber || "",
                                brand: matchedVariant.Brand?.BrandName || "",
                                brand: "Cannondale",
                                product_type: matchedVariant.ProductType || "",
                                quantity: matchedVariant.AvailableQuantity || 0,
                                size: matchedVariant.Size || "",
                                wheel_size_front: matchedVariant.WheelSizeFront || "",
                                wheel_size_rear: matchedVariant.WheelSizeRear || "",
                                level: matchedVariant.Level || "",
                                model: matchedVariant.Model || "",
                                model_series_name: matchedVariant.ModelSeriesName || "",
                                model_year: matchedVariant.ModelYear || "",
                                item_group_name: matchedVariant.ItemGroupName || "",

                                normal_price: matchedVariant.DealerHiddenPrice || 0,
                                consumer_price: matchedVariant.MSRPSellingPrice || 0,
                                dealer_price: matchedVariant.DealerHiddenPrice || 0,
                                ...getProfitMargin({
                                    a: matchedVariant.MSRPSellingPrice || 0,
                                    b: matchedVariant.DealerHiddenPrice || 0,
                                }),
                            };

                            bike.skus.push(sd);
                        }
                    }
                }

                items.push(bike);
            }

            newData = items;

            // for (const item of data) {
            //     const url = item?.url || '';
            //     const isGet = item?.request?.method === 'GET';
            //     const allSkus = [];

            //     // first get bikes top level
            //     if (isGet && url.includes('SearchNavigationalProductApi')) {
            //         for (const subItem of item?.response?.data?.['Results'] || []) {
            //             let d = {
            //                 id: subItem.Id || "",
            //                 name: subItem.DisplayName || "",
            //                 source: source || "",
            //                 in_stock: subItem.inStock || false,
            //                 product_image: subItem.ImageUrl || "",
            //                 skus: (subItem?.['Variants'] || []).map(variant => ({
            //                     id: variant.VariantId || "",
            //                     name: subItem.DisplayName || "",
            //                     brand: subItem['Brand'] || "",
            //                     size: variant.Size || "",
            //                     model_year: subItem['ModelYear'] || "",
            //                 })) || []
            //             }
            //             newData.push(d);
            //         }
            //     }

            //     // console.log('GetSKUsFromSAP: ', {
            //     //     url: url.includes('GetSKUsFromSAP'),
            //     //     isGet,
            //     // });

            //     if (!isGet && url.includes('GetSKUsFromSAP')) {
            //         for (const subItem of item?.response?.data || []) {
            //             let sd = {
            //                 id: subItem.VariantId || subItem.Number || "",
            //                 name: subItem.Name || subItem.DisplayName || subItem.ItemDescription || "",
            //                 source: source || "",
            //                 in_stock: subItem.InStock || false,
            //                 record_url: subItem.RecordUrl || subItem.recordUrl || "",
            //                 item_number: subItem.Number || subItem.ItemNumber || "",
            //                 brand: subItem.Brand || "",
            //                 product_type: subItem.ProductType || "",
            //                 quantity: subItem.AvailableQuantity || 0,
            //                 size: subItem.Size || "",
            //                 wheel_size_front: subItem.WheelSizeFront || "",
            //                 wheel_size_rear: subItem.WheelSizeRear || "",
            //                 level: subItem.Level || "",
            //                 model: subItem.Model || "",
            //                 model_series_name: subItem.ModelSeriesName || "",
            //                 model_year: subItem.ModelYear || "",
            //                 item_group_name: subItem.ItemGroupName || "",

            //                 normal_price: subItem.DealerHiddenPrice || 0,
            //                 consumer_price: subItem.MSRPSellingPrice || 0,
            //                 dealer_price: subItem.DealerHiddenPrice || 0,
            //                 ...getProfitMargin({
            //                     a: subItem.MSRPSellingPrice || 0,
            //                     b: subItem.DealerHiddenPrice || 0,
            //                 }),
            //             }

            //             allSkus.push(sd);
            //         }
            //     }

            //     // console.log('allSkus: ', allSkus?.length || 0);

            //     // loop over all skus and match with the top level bikes' skus , by merging
            //     const unmatchedSkus = [];
            //     for (const sku of allSkus) {
            //         const matchedBike = newData.find(bike => bike.skus.some(s => s.id === sku.id));
            //         if (matchedBike) {
            //             matchedBike.skus = matchedBike.skus.map(s => {
            //                 if (s.id === sku.id) {
            //                     return {
            //                         ...s,
            //                         ...sku,
            //                     }
            //                 }
            //                 return s;
            //             });
            //         } else {
            //             unmatchedSkus.push(sku);
            //         }
            //     }

            //     if (unmatchedSkus.length > 0) {
            //         const fallbackGroups = new Map();

            //         for (const sku of unmatchedSkus) {
            //             const fallbackKey = sku.item_group_name || sku.model || sku.model_series_name || sku.name || sku.id;

            //             if (!fallbackGroups.has(fallbackKey)) {
            //                 fallbackGroups.set(fallbackKey, {
            //                     id: fallbackKey,
            //                     name: sku.item_group_name || sku.model || sku.model_series_name || sku.name || sku.id,
            //                     source: source || "",
            //                     in_stock: sku.in_stock || false,
            //                     product_image: "",
            //                     record_url: sku.record_url || "",
            //                     model_year: sku.model_year || "",
            //                     skus: [],
            //                 });
            //             }

            //             const bike = fallbackGroups.get(fallbackKey);
            //             bike.in_stock = bike.in_stock || sku.in_stock;
            //             bike.record_url = bike.record_url || sku.record_url || "";
            //             bike.model_year = bike.model_year || sku.model_year || "";
            //             bike.skus.push(sku);
            //         }

            //         newData.push(...Array.from(fallbackGroups.values()));
            //     }
            // }
        }
        return newData;

    } catch (error) {
        console.error('ERROR: formatting data:', error);
        return [];
    }
};
// db saver
const saveDataToDB = async ({ data, workspaceId }) => {
    try {

        for (const item of data) {
            if (!item.name || !item.result) {
                appConsole.warn('Data item missing name or result, skipping:', item);
                continue;
            }

            // if data is empty array, skip
            if (!item.result.data || (Array.isArray(item.result.data) && item.result.data.length === 0)) {
                appConsole.warn('Data item has empty data array, skipping:', item);
                continue;
            }

            const dtoSaveData = [];
            const thisData = item.result.data;
            for (const dataItem of thisData) {
                let sd = dataItem;
                if (dataItem.skus) {
                    sd.connect = {
                        skus: dataItem.skus
                    }
                    delete sd.skus;
                }
                dtoSaveData.push(sd);
            }

            // console.log(' dtoSaveData[0]: ', dtoSaveData[0]);
            // return;

            // First, upsert all bikes
            for (const sd of dtoSaveData) {
                await Prisma.bikes.upsert({
                    where: { id: sd.id, source: item.name },
                    update: {
                        name: sd.name,
                        source: sd.source,
                        in_stock: sd.in_stock,
                        product_image: sd.product_image,
                        record_url: sd.record_url,
                        workspace: {
                            connect: { id: workspaceId }
                        }
                    },
                    create: {
                        id: sd.id,
                        name: sd.name,
                        source: sd.source,
                        in_stock: sd.in_stock,
                        product_image: sd.product_image,
                        record_url: sd.record_url,
                        workspace: {
                            connect: { id: workspaceId }
                        }
                    }
                });
            }

            const skuIds = dtoSaveData.flatMap(sd =>
                sd.connect?.skus?.map(sku => sku.id).filter(Boolean) || []
            );



            const existingSkus = skuIds.length
                ? await Prisma.skus.findMany({
                    where: {
                        id: { in: skuIds },
                        source: item.name,
                    },
                    select: {
                        id: true,
                        profit_margin: true,
                    }
                })
                : [];

            const existingSkuProfitMarginMap = new Map(
                existingSkus.map(existingSku => [existingSku.id, existingSku.profit_margin])
            );

            // Then, upsert all SKUs (now that bikes exist)
            for (const sd of dtoSaveData) {
                if (sd.connect?.skus?.length) {
                    for (const sku of sd.connect.skus) {
                        const prevProfitMargin = existingSkuProfitMarginMap.get(sku.id) ?? 0;

                        await Prisma.skus.upsert({
                            where: { id: sku.id, source: item.name },
                            update: {
                                ...sku,
                                prev_profit_margin: prevProfitMargin,
                                bike: { connect: { id: sd.id } },
                                workspace: { connect: { id: workspaceId } }
                            },
                            create: {
                                ...sku,
                                prev_profit_margin: prevProfitMargin,
                                bike: { connect: { id: sd.id } },
                                workspace: { connect: { id: workspaceId } }
                            }
                        });
                    }
                }
            }


            // now change in_stock to false for skus that are not in the current scrape but exist in the db for this workspace
            if (skuIds.length) {
                console.log(`Checking for SKUs to mark as out of stock. Current scrape has ${skuIds.length} SKUs.`);

                const notScrapedSkus = await Prisma.skus.findMany({
                    where: {
                        id: { notIn: skuIds },
                        workspace_id: workspaceId,
                        source: item.name,
                    },
                    select: {
                        id: true,
                    }
                });

                console.log(`Found ${notScrapedSkus.length} SKUs that were not in the current scrape.`);
                if (notScrapedSkus.length > 0) {

                    await Prisma.skus.updateMany({
                        where: {
                            id: { in: notScrapedSkus.map(sku => sku.id) },
                            workspace_id: workspaceId,
                            source: item.name,
                        },
                        data: {
                            in_stock: false,
                        }
                    });

                    console.log(`Marked ${notScrapedSkus.length} SKUs as out of stock.`);
                } else {
                    console.log('No SKUs to mark as out of stock.');
                }
            }
        }

        console.log('saveDataToDB >>> Data saved to DB successfully');
    } catch (error) {
        console.error('saveDataToDB >>> Error saving data to DB:', error);
    }
};



// main
// ============================
export default async function startScrape({
    data = null,
    workspaceId = null,
    callback = null,
}) {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };


    const logger = ((prefix = 'startScrape >>>') => {
        return {
            log: (...args) => appConsole.log(prefix, ...args),
            error: (...args) => appConsole.error(prefix, ...args),
            warn: (...args) => appConsole.warn(prefix, ...args)
        }
    })();


    try {

        const nowDate = new Date();
        console.log('==================================================================');
        const readableDate = nowDate.toLocaleString('en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        logger.log(`Scrape started at ${readableDate}`);
        console.log('==================================================================');
        console.log('');


        if (!BROWSERLESS_URL || !BROWSERLESS_TOKEN) {
            const missingVars = [];
            if (!BROWSERLESS_URL) missingVars.push('BROWSERLESS_URL');
            if (!BROWSERLESS_TOKEN) missingVars.push('BROWSERLESS_TOKEN');
            const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
            logger.error(errorMessage);
            resObj.message = errorMessage;
            return resObj;
        }

        if (!workspaceId) {
            logger.error('No workspaceId provided for scraping');
            resObj.success = false;
            resObj.message = 'No workspaceId provided for scraping';
            return resObj;
        }

        const tasks = [
            {
                name: 'giantGroup',
                stealth: true,
                timeout: 360000,
                functionStr: `export default async function ({ page }) { const userName = "${GG_USERNAME}"; const password = "${GG_PASSWORD}";\n${getFuncBody(giantGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
                getResult: (obj) => {
                    const result = {
                        ...obj,
                        clcError: obj?.clcError || null,
                        data: formatData({
                            data: obj.data,
                            source: 'giantGroup'
                        })
                    };
                    return result;
                },
            },
            {
                name: 'cyclingsportsgroup',
                stealth: true,
                timeout: 360000,
                functionStr: `export default async function ({ page }) { const userName = "${CCG_USERNAME}"; const password = "${CCG_PASSWORD}";\n${getFuncBody(cyclingSportsGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
                workspaceId,
                // logger: (obj) => {
                //     console.log('cyclingsportsgroup logger: ', obj);
                // },
                result: null,
                getResult: (obj) => {
                    // console.log('getResult obj', obj);
                    const formattedData = formatData({
                        data: obj?.data,
                        source: 'cyclingsportsgroup'
                    })
                    // console.log('formattedData', formattedData);

                    const result = {
                        ...obj,
                        data: formattedData
                    };

                    return result;
                }
            },
            // {
            //     name: 'qbp',
            //     stealth: true,
            //     timeout: 240000,
            //     data: `export default async function ({ page }) { const userName = "${QBP_USERNAME}"; const password = "${QBP_PASSWORD}";\n${getFuncBody(qbp)}\n}`.trim(),
            //     isLocalSave: false,
            //     result: null,
            //     isDbSave: false,
            //     workspaceId,
            // }
        ];
        const taskResults = [];

        for (const task of tasks) {
            const now = Date.now();
            logger.log(`-------- Starting task: ${task.name} --------`);

            const tResult = await browserless(task.functionStr)
            task.result = tResult;

            logger.log('task.name', task.name, '  took', Date.now() - now, 'ms');
            logger.log('message', tResult.message, ' Result.data.length: ', tResult?.data?.length)
            const formattedData = task.getResult ? task.getResult(tResult) : tResult;
            logger.log('formattedData.data.length', formattedData?.data?.length)
            taskResults.push({ name: task.name, result: formattedData });

            logger.log('scrap >>> Saving to DB for task: ', task.name);
            await saveDataToDB({
                data: [{ name: task.name, result: formattedData }],
                workspaceId: task.workspaceId || workspaceId,
            });
            logger.log('Saved to DB: ', task.name);
            logger.log('Completed');
            console.log('--');
        }



        const scrapId = data && data?.id ? data.id : null;
        if (scrapId) {
            await Prisma.scraps.update({
                where: { id: scrapId },
                data: {
                    // result: result,
                    status: 'completed',
                }
            });
        }


        // saveDataToDB({ data: result.data, workspaceId });
        if (callback && typeof callback === 'function') {
            const cd = [];
            taskResults.forEach(item => {
                const d = Array.isArray(item.result)
                    ? item.result
                    : Array.isArray(item.result?.data) ? item.result.data : [];

                cd.push(...d);
            });

            if (cd.length === 0) {
                logger.warn('callback >>> No data to send in callback');
            }

            callback(cd);
        };


        // save locally if its dev
        if (IS_DEV) {
            const filePath = `./data/startScrape_result.json`;
            fs.writeFileSync(filePath, JSON.stringify(taskResults, null, 2));
            logger.log(`Result saved locally at ${filePath}`);
        }

        resObj.success = true;
        resObj.message = 'Scraping completed successfully';
        resObj.data = taskResults;
        return resObj;

    } catch (error) {
        logger.error('Error in startScrape function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
}





