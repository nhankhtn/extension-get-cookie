document.addEventListener('DOMContentLoaded', function () {
    const cookieSection = document.getElementById('cookie-section');

    async function fetchShopInfo() {
        const resGetShopInfo = await fetch(CONFIG.API_SHOP, {
            method: 'GET',
            credentials: 'include',
        });
        return await resGetShopInfo.json();
    }

    async function fetchExistingCookies(shopName) {
        const resGetCookies = await fetch(`${CONFIG.API_URL}?where=%28username%2Ceq%2C${shopName}%29`, {
            headers: {
                "xc-token": CONFIG.API_TOKEN
            }
        });
        return await resGetCookies.json();
    }

    async function saveCookiesToServer(method, data) {
        await fetch(CONFIG.API_URL, {
            method,
            headers: {
                'Content-Type': 'application/json',
                "xc-token": CONFIG.API_TOKEN
            },
            body: JSON.stringify(data)
        });
    }

    function saveCookiesToAPI() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                if (!url.hostname.includes('affiliate.tiktok.com')) {
                    cookieSection.innerHTML = `<span style="color: red;">✗ Please open affiliate.tiktok.com</span>`;
                    return;
                }

                chrome.cookies.getAll({}, async function (cookies) {
                    const filteredCookies = cookies.filter(cookie => cookie.domain === '.tiktok.com' || cookie.domain === 'affiliate.tiktok.com');

                    try {
                        // fetch API to get shop info
                        const resp = await fetchShopInfo();

                        // Check error when user not login
                        if (resp.code !== 0) {
                            cookieSection.innerHTML = `<span style="color: red;">✗ ${resp.message}</span>`;
                            return;
                        }

                        // Check if cookies already exist in API to update cookies
                        const respCookies = await fetchExistingCookies(resp.shop_name);

                        if (respCookies.list.length > 0) {
                            await saveCookiesToServer('PATCH', {
                                Id: respCookies.list[0].Id,
                                data: filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
                            });
                            cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
                            return;
                        }

                        // Save cookies to API if cookies not exist in API
                        const data = {
                            site: "affiliate.tiktok.com",
                            data: filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
                            username: resp.shop_name
                        }

                        // fetch API to save cookies
                        await saveCookiesToServer('POST', data);
                        cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
                    } catch (error) {
                        console.error('Error updating cookies:', error);
                        cookieSection.innerHTML = '<span style="color: red;">✗ Failed</span>';
                    }
                });
            }
        });
    };

    saveCookiesToAPI();
});
