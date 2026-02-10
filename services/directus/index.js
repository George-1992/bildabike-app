const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;


export const directusRequest = async ({
    method = 'GET',
    endpoint = '',
    payload = null,
    params = {}
}) => {
    let resObj = {
        success: false,
        warning: false,
        message: '',
        data: null,
    }
    const isPost = ['POST', 'PATCH', 'PUT'].includes(method.toUpperCase());

    if (!DIRECTUS_URL || !DIRECTUS_API_TOKEN) {
        resObj.message = 'DIRECTUS_URL or DIRECTUS_API_TOKEN is not set in environment variables';
        return resObj;
    }

    if (!endpoint || typeof endpoint !== 'string') {
        resObj.message = 'Path is required and must be a string';
        return resObj;
    }

    if (!payload && isPost) {
        resObj.message = 'Payload is required';
        return resObj;
    }


    try {
        // Handle nested objects in params (especially filter objects)
        let queryString = '';
        if (Object.keys(params).length) {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, _value]) => {
                const value = Array.isArray(_value)
                    ? _value.join(',')
                    : _value;
                // console.log('key, value ==> ', key, value);

                if (typeof value === 'object' && value !== null) {
                    // Handle nested objects (like filter objects) by JSON stringifying
                    searchParams.append(key, JSON.stringify(value));
                } else {
                    searchParams.append(key, value);
                }
            });

            queryString = '?' + searchParams.toString();
        }

        const url = `${DIRECTUS_URL}${endpoint}${queryString}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DIRECTUS_API_TOKEN}`
            },

        };
        if (isPost) {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);
        const json = await response.json();

        // console.log('json ==> ', json.errors);

        if (json.errors) {
            let msg = '';
            if (Array.isArray(json.errors)) {

                json.errors.forEach(err => {
                    msg += err.message;
                    if (err.extensions) {
                        msg += ` (${JSON.stringify(err.extensions)})`;
                    }
                });
            } else if (typeof json.errors === 'object' && json.errors.message) {
                msg = json.errors.message;
            } else {
                msg = 'An error occurred';
            }

            resObj.message = msg;
            return resObj;
        }

        resObj.success = response.ok;
        resObj.message = json.message || '';
        resObj.data = json.data || null;
        return resObj;

    } catch (error) {
        console.error(error);
        resObj.message = error.message || 'An error occurred';
        return resObj;
    }
}
