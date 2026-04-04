const FAREHARBOUR_USERNAME = "daniel";
const FAREHARBOUR_PASSWORD = "Bildabike007$$$";

const getFuncBody = (func) => {
    const funcStr = func.toString();
    const match = funcStr.match(/^async\s*\([^)]*\)\s*=>\s*\{([\s\S]*)\}\s*$/);
    return match ? match[1].trim() : funcStr;
};
const fairharbor = async () => {
    try {
        console.log("Fairharbor function called!");

        const innerFunc = async ({ page }) => {
            let resObj = {
                success: false,
                message: "unknown error",
                data: null,
                screenshots: [],
            };
            try {
                // Set the viewport to a desktop size, for example 1920x1080
                await page.setViewport({
                    width: 1920,
                    height: 1080,
                });

                // got to https://fareharbor.com/bildabike/login/ and locate
                // username input and password input and fill them with FAREHARBOUR_USERNAME and FAREHARBOUR_PASSWORD
                // then click the login button and wait for the page to load
                await page.goto("https://fareharbor.com/bildabike/login/", {
                    waitUntil: "networkidle2",
                    timeout: 360000,
                });

                // find and fill username and password inputs
                await page.type('input[name="username"]', userName || "", {
                    delay: 100,
                });
                await page.type('input[name="password"]', password || "", {
                    delay: 100,
                });

                // click the login button and wait for the page to load
                await page.click('button[type="submit"]');
                await page.waitForNavigation({
                    waitUntil: "networkidle2",
                    timeout: 360000,
                });

                // await to for data-test-id="manifest-header-nav" to be loaded
                await page.waitForSelector('[data-test-id="manifest-header-nav"]', {
                    timeout: 360000,
                });

                // //make a screenshot and save in
                // const screenshot1 = await page.screenshot({ fullPage: true });
                // resObj.screenshots.push({
                //     name: 'login_page.png',
                //     data: screenshot1,
                // });

                // open the following link which will result in json response
                // and send it as data
                // https://fareharbor.com/api/v1/companies/bildabike/manifest/availabilities/date/2026-04-03/

                // const link = 'https://fareharbor.com/api/v1/companies/bildabike/manifest/availabilities/date/2026-04-03/';
                // const response = await page.goto(link, { waitUntil: 'networkidle2', timeout: 240000 });
                // const json = await response.json();
                // resObj.data = json;

                const days = [7, 2, 1];
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const dayRequests = days.map((daysAfter) => {
                    const targetDate = new Date(today);
                    targetDate.setDate(targetDate.getDate() + daysAfter);

                    const year = targetDate.getFullYear();
                    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                    const day = String(targetDate.getDate()).padStart(2, '0');
                    const date = `${year}-${month}-${day}`;
                    const link = `https://fareharbor.com/api/v1/companies/bildabike/manifest/availabilities/date/${date}/`;

                    return { daysAfter, date, link };
                });
                // resObj.allDaysLinks = dayRequests.map((item) => item.link);

                const browser = page.browser();
                const results = await Promise.all(
                    dayRequests.map(async ({ daysAfter, date, link }) => {
                        const tab = await browser.newPage();
                        try {
                            const response = await tab.goto(link, {
                                waitUntil: 'networkidle2',
                                timeout: 360000,
                            });
                            const json = await response.json();
                            return { daysAfter, date, link, data: json };
                        } finally {
                            await tab.close();
                        }
                    })
                );


                resObj.success = true;
                resObj.message = "Data fetched successfully";
                resObj.data = results;

                return resObj;
            } catch (error) {
                console.error("Error in Fairharbor function: ", error);
                resObj = {
                    success: false,
                    message: "Error executing Fairharbor function: " + error.message,
                    data: null,
                    screenshots: [],
                };

                return resObj;
            }
        };
        // =======================================================================================

        const str =
            `export default async function ({ page }) { const userName = ${JSON.stringify(FAREHARBOUR_USERNAME || "")}; const password = ${JSON.stringify(FAREHARBOUR_PASSWORD || "")};\n${getFuncBody(innerFunc)}\n}`.trim();

        return {
            code: str,
        };
    } catch (error) {
        console.error(error);
        return {
            code: "",
        };
    }
};

return fairharbor();
