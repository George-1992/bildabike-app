'use server';
import bcrypt from 'bcrypt';
import Prisma from '@/services/prisma';
import sendEmail from '@/services/emailing';
import { processEmailBody } from '@/utils/other';


export const saGetItem = async ({
    collection = '',
    query = null,
}) => {
    // console.log('saGetItem called with collection: ', collection, ' id: ', id, ' fields: ', fields);
    let resObj = {
        success: false,
        message: 'Collection and ID are required',
        data: null
    }

    try {
        if (!query || typeof query !== 'object') {
            resObj.message = 'Invalid query object';
            return resObj;
        }

        const data = await Prisma[collection].findFirst(query);

        if (!data) {
            resObj.message = 'Item not found';
            return resObj;
        }

        if (data.password) {
            delete data.password;
        }

        resObj.success = true;
        resObj.message = 'Item fetched successfully';
        resObj.data = data;
        return resObj;

    } catch (error) {
        console.error('Error in getItem: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};
export const saGetItems = async ({
    collection = '',
    query = null,
    includeCount = false,
}) => {
    // console.log('saGetItem called with collection: ', collection, ' id: ', id, ' fields: ', fields);
    let resObj = {
        success: false,
        message: 'Collection and ID are required',
        data: null,
        count: null
    }

    try {
        let _query = query || {};
        // if (!query || typeof query !== 'object') {
        //     resObj.message = 'Invalid query object';
        //     return resObj;
        // }

        let data, count;

        if (includeCount) {
            // Run both queries in parallel
            [data, count] = await Promise.all([
                Prisma[collection].findMany(_query),
                Prisma[collection].count({ where: _query.where || {} })
            ]);
        } else {
            data = await Prisma[collection].findMany(_query);
        }

        if (!data) {
            resObj.message = 'Items not found';
            return resObj;
        }

        for (let i = 0; i < data.length; i++) {
            if (data[i].password) {
                delete data[i].password;
            }
        }

        resObj.success = true;
        resObj.message = 'Successfully fetched';
        resObj.data = data;
        if (includeCount) {
            resObj.count = count;
        }
        return resObj;

    } catch (error) {
        console.error('Error in getItem: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null,
            count: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};
export const saUpdateItem = async ({
    collection = '',
    query = null,
}) => {

    // console.log('saUpdateItem called with collection: ', collection, ' and data: ', data);
    let resObj = {
        success: false,
        message: 'Collection is required',
        data: null
    }


    try {

        const itemId = query && query.data && query.data.id ? query.data.id : null;
        if (!collection) {
            resObj.message = 'Collection is required';
            return resObj;
        }
        const data = await Prisma[collection].update(query);

        if (!data) {
            resObj.message = 'Item not found or not updated';
            return resObj;
        }
        if (data.password) {
            delete data.password;
        }

        resObj.success = true;
        resObj.message = 'Item updated successfully';
        resObj.data = data;

        return resObj;

    } catch (error) {
        console.error('Error in updateItem: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};
export const saUpdatePassword = async ({
    userId = null,
    data = null,
}) => {
    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null
    }

    try {
        if (!userId) {
            resObj.message = 'User ID is required';
            return resObj;
        }
        if (!data || !data.newPassword) {
            resObj.message = 'New password is required';
            return resObj;
        }
        if (!data || !data.currentPassword) {
            resObj.message = 'Current password is required';
            return resObj;
        }

        // get user first
        const userData = await Prisma.users.findUnique({
            where: { id: userId }
        });
        console.log('userData ==> ', userData);

        if (!userData || !userData.password) {
            resObj.message = 'User not found';
            return resObj;
        }

        // console.log('data ==> ', data);


        // first check if current password is correct
        const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, userData.password);
        // console.log('isCurrentPasswordValid ==> ', isCurrentPasswordValid);

        if (!isCurrentPasswordValid) {
            resObj.message = 'Current password is incorrect';
            return resObj;
        }

        // update password
        const saltRounds = 10;
        const newPassword = await bcrypt.hash(data.newPassword, saltRounds);

        const updatedUser = await Prisma.users.update({
            where: { id: userId },
            data: { password: newPassword }
        });
        if (updatedUser && updatedUser.password) {
            delete updatedUser.password
            resObj.message = 'Password updated successfully'
        }
        resObj.success = true;
        resObj.data = updatedUser;
        resObj.message = 'Password updated successfully';

        return resObj;

    } catch (error) {
        console.error('Error in updatePassword: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};
export const saCreateItem = async ({
    collection = '',
    data = null,
}) => {

    // console.log('saCreateItem called with collection: ', collection, ' and data: ', data);

    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null
    }

    try {
        if (!collection) {
            resObj.message = 'Collection is required';
            return resObj;
        }
        if (!data) {
            resObj.message = 'Data is required';
            return resObj;
        }

        // if data has password field, hash it
        if (data.password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword;
        }

        // if data id or email exists on data check
        // if data is already exists return error
        if (data.id || data.email) {
            let where = {};
            if (data.id) where.id = data.id;
            if (data.email) where.email = data.email;

            const existingItem = await Prisma[collection].findFirst({
                where
            });
            if (existingItem) {
                resObj.message = `${collection} with ${data.id ? `ID ${data.id}` : ''}${data.id && data.email ? ' and ' : ''}${data.email ? `Email ${data.email}` : ''} already exists`;
                return resObj;
            }
        }

        const createdItem = await Prisma[collection].create({
            data
        });

        if (!createdItem) {
            resObj.message = 'Item not created';
            return resObj;
        }

        resObj.success = true;
        resObj.message = 'Item created successfully';
        resObj.data = createdItem;

        return resObj;

    } catch (error) {
        console.error('Error in createItem: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};

export const saDeleteItem = async ({
    collection = '',
    query = null,
}) => {

    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null
    }

    try {
        if (!collection) {
            resObj.message = 'Collection is required';
            return resObj;
        }
        if (!query) {
            resObj.message = 'Query is required';
            return resObj;
        }

        let deletedItem;

        // Handle foreign key constraints for users
        if (collection === 'users') {
            // First delete related records in users_and_accounts
            await Prisma.users_and_accounts.deleteMany({
                where: {
                    user_id: query.where.id
                }
            });

            // Then delete the user
            deletedItem = await Prisma[collection].delete(query);
        } else {
            // For other collections, delete normally
            deletedItem = await Prisma[collection].delete(query);
        }

        if (!deletedItem) {
            resObj.message = 'Item not deleted';
            return resObj;
        }

        resObj.success = true;
        resObj.message = 'Item deleted successfully';
        resObj.data = deletedItem;

        return resObj;

    } catch (error) {
        console.error('Error in deleteItem: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null
        }
    } finally {
        // Prisma.$disconnect();
    }
};

export const saDeleteItems = async ({
    collection = '',
    ids = [],
}) => {

    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null,
        count: 0
    }

    try {
        if (!collection) {
            resObj.message = 'Collection is required';
            return resObj;
        }
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            resObj.message = 'IDs array is required and must not be empty';
            return resObj;
        }

        let deletedCount;

        // Handle foreign key constraints for users
        if (collection === 'users') {
            // First delete related records in users_and_accounts
            await Prisma.users_and_accounts.deleteMany({
                where: {
                    user_id: {
                        in: ids
                    }
                }
            });

            // Then delete the users
            const result = await Prisma[collection].deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });
            deletedCount = result.count;
        } else {
            // For other collections, delete normally
            const result = await Prisma[collection].deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });
            deletedCount = result.count;
        }

        if (deletedCount === 0) {
            resObj.message = 'No items were deleted';
            return resObj;
        }

        resObj.success = true;
        resObj.message = `${deletedCount} item${deletedCount > 1 ? 's' : ''} deleted successfully`;
        resObj.count = deletedCount;

        return resObj;

    } catch (error) {
        console.error('Error in deleteItems: ', error);
        return {
            success: false,
            message: error.message || 'An error occurred',
            data: null,
            count: 0
        }
    } finally {
        // Prisma.$disconnect();
    }
};

export const saSendEmail = async ({
    template = null,
    contacts = [],
}) => {
    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null
    }
    try {


        // console.log('template: ', template);
        // console.log('contacts: ', contacts);
        // return resObj

        // if template is null or contacts is not array or empty return error
        if (!template || !Array.isArray(contacts) || contacts.length === 0) {
            resObj.message = 'Invalid template or contacts';
            return resObj;
        }

        // send email to each contact
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const emailResult = await sendEmail({
                sendTo: contact.email,
                subject: template.subject,
                html: processEmailBody({
                    body: template.body,
                    contact: contact
                })
            });
            // console.log('emailResult: ', emailResult);
        }

        resObj.success = true;
        resObj.message = 'Emails sent successfully';
        return resObj;

    } catch (error) {
        console.error('Error in sendEmail: ', error);
        resObj.success = false;
        resObj.message = error.message || 'An error occurred';
        return resObj;
    } finally {
        // Prisma.$disconnect();
    }
    return resObj;
};

