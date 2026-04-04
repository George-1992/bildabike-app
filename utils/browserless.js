import fs from 'fs';

const makeErrorResponse = (message) => ({
    success: false,
    message,
    data: null,
});

const toBuffer = (data) => {
    if (!data) {
        return null;
    }

    if (Buffer.isBuffer(data)) {
        return data;
    }

    if (typeof data === 'string') {
        return Buffer.from(data, 'base64');
    }

    if (Array.isArray(data)) {
        return Buffer.from(data);
    }

    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }

    if (data instanceof ArrayBuffer) {
        return Buffer.from(data);
    }

    if (typeof data === 'object' && data.type === 'Buffer' && Array.isArray(data.data)) {
        return Buffer.from(data.data);
    }

    if (typeof data === 'object') {
        // Some payloads come as nested wrappers like { data: { ...bytes... } }
        if (data.data && data.data !== data) {
            const nestedBuffer = toBuffer(data.data);
            if (nestedBuffer) {
                return nestedBuffer;
            }
        }

        // Support Uint8Array-like JSON objects: { "0": 137, "1": 80, ... }
        const keys = Object.keys(data);
        if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
            const bytes = keys
                .map((k) => Number(k))
                .sort((a, b) => a - b)
                .map((idx) => Number(data[String(idx)]));

            if (bytes.every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
                return Buffer.from(bytes);
            }
        }
    }

    return null;
};

export const processBrowserless = async (response) => {
    try {
        const status = response?.status;
        // console.log('Response status:', status);

        if (!response || typeof response.text !== 'function') {
            return makeErrorResponse('Error processing browserless response: invalid response object');
        }

        const responseTextRaw = await response.text();
        const responseText = typeof responseTextRaw === 'string' ? responseTextRaw.trim() : '';

        if (!responseText || responseText === 'undefined' || responseText === 'null') {
            return makeErrorResponse(`Error processing browserless response: empty or non-JSON payload (status ${status})`);
        }

        let resObj;
        try {
            resObj = JSON.parse(responseText);
        } catch (error) {
            const preview = responseText.slice(0, 200);
            return makeErrorResponse(
                `Error processing browserless response: invalid JSON payload (status ${status}) - ${error.message}. Payload preview: ${preview}`
            );
        }

        const operationalKeys = ['screenshots', 'pdfs', 'htmls'];
        await fs.promises.mkdir('./data/browserless', { recursive: true });

        for (const key of operationalKeys) {
            if (resObj[key] && Array.isArray(resObj[key])) {
                const urls = [];
                console.log(`Processing items for key "${key}":`, resObj[key].length);

                for (const item of resObj[key]) {
                    const data = item?.data;
                    const filename = item?.filename || item?.name;

                    if (!data || !filename) {
                        console.warn(`Skipping item with missing data or filename in key "${key}":`);
                        continue;
                    }

                    const buffer = toBuffer(data);
                    if (!buffer) {
                        const shape = data && typeof data === 'object'
                            ? `{keys:${Object.keys(data).slice(0, 8).join(',')}}`
                            : typeof data;
                        console.warn(`Unable to convert data to buffer for item in key "${key}" (shape: ${shape})`);
                        continue;
                    }

                    const filePath = `./data/browserless/${filename}`;
                    await fs.promises.writeFile(filePath, buffer);
                    urls.push(`/data/browserless/${filename}`);
                }

                resObj[key] = urls;
            }
        }

        const newResObj = {};
        Object.keys(resObj).forEach((key) => {
            if (!operationalKeys.includes(key)) {
                newResObj[key] = resObj[key];
            }
        });

        return newResObj;
    } catch (error) {
        console.error('processBrowserless >>> error: ', error);
        return makeErrorResponse('Error processing browserless response: ' + error.message);
    }
};