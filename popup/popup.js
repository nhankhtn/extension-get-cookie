document.addEventListener('DOMContentLoaded', function () {
    const cookieSection = document.getElementById('cookie-section');

    async function fetchInfo(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const respGetInfo = await fetch(`${url}?${queryString}`, {
            method: 'GET',
            credentials: 'include',
        });
        return await respGetInfo.json();
    }

    async function fetchExistingCookies(url, params) {
        const queryString =
            Object.entries(params).map(([key, value]) => `where=%28${key}%2Ceq%2C${value}%29`).join('&');

        const resGetCookies = await fetch(`${url}?${queryString}`, {
            headers: {
                "xc-token": CONFIG.API_TOKEN
            }
        });
        return await resGetCookies.json();
    }

    async function saveCookiesToServer(url, method, data) {
        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                "xc-token": CONFIG.API_TOKEN
            },
            body: JSON.stringify(data)
        });
    }

    async function updateCookieAffiliate(filteredCookies) {
        try {
            // fetch API to get shop info
            const resp = await fetchInfo(CONFIG.API_SHOP);

            // Check error when user not login
            if (resp.code !== 0) {
                cookieSection.innerHTML = `<span style="color: red;">✗ ${resp.message}</span>`;
                return;
            }

            // Check if cookies already exist in API to update cookies
            const respCookies = await fetchExistingCookies(CONFIG.API_URL, {
                username: resp.shop_name
            });

            if (respCookies.list.length > 0) {
                await saveCookiesToServer(CONFIG.API_URL, 'PATCH', {
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
            await saveCookiesToServer(CONFIG.API_URL, 'POST', data);
            cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
        } catch (error) {
            console.error('Error updating cookies:', error);
            cookieSection.innerHTML = '<span style="color: red;">✗ Failed</span>';
        }
    }

    async function updateCookiePartner(filteredCookies) {
        try { // fetch API to get shop info
            const resp_account = await fetchInfo(CONFIG.API_PROFILE_PARTNER);
            const resp_partner = await fetchInfo(CONFIG.API_PARTNER, {
                partner_type: 1
            });

            // Check error when user not login
            if (resp_account.code !== 0 || resp_partner.code !== 0) {
                cookieSection.innerHTML = `<span style="color: red;">✗ ${resp.message}</span>`;
                return;
            }
            const account_id = resp_account.data.partner_id;
            const partner_id = resp_partner.data.partner_biz_role_info.market_list[0].type_list.find(type => type.type === 1).partner_id;
            // Check if cookies already exist in API to update cookies
            const respCookies = await fetchExistingCookies(CONFIG.API_URL_DB_PARTNER, {
                account_id
            });

            if (respCookies.list.length > 0) {
                await saveCookiesToServer(CONFIG.API_URL_DB_PARTNER, 'PATCH', {
                    Id: respCookies.list[0].Id,
                    data: filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
                });
                cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
                return;
            }

            // Save cookies to API if cookies not exist in API
            const data = {
                data: filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
                partner_id,
                account_id
            }

            // fetch API to save cookies
            await saveCookiesToServer(CONFIG.API_URL_DB_PARTNER, 'POST', data);
            cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
        } catch (error) {
            console.error('Error updating cookies:', error);
            cookieSection.innerHTML = '<span style="color: red;">✗ Failed</span>';
        }
    }

    function saveCookiesToAPI() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                const url = new URL(tabs[0].url);

                if (!url.hostname.includes('affiliate.tiktok.com') && !url.hostname.includes('partner.tiktokshop.com')) {
                    cookieSection.innerHTML = `<span style="color: red;">✗ URL invalid</span>`;
                    return;
                }

                chrome.cookies.getAll({}, async function (cookies) {
                    const filteredCookies = cookies.filter(cookie =>
                        url.hostname.includes('affiliate.tiktok.com')
                            ? cookie.domain.includes('.tiktok.com')
                            : cookie.domain.includes('.tiktokshop.com')
                    );

                    if (url.hostname.includes("affiliate.tiktok.com")) {
                        updateCookieAffiliate(filteredCookies);
                    }
                    else {
                        updateCookiePartner(filteredCookies);
                    }
                });
            }
        });
    };

    saveCookiesToAPI();
});
