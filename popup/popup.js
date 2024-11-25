document.addEventListener('DOMContentLoaded', function () {
    const consentSection = document.getElementById('consent-section');
    const cookieSection = document.getElementById('cookie-section');
    const acceptBtn = document.getElementById('acceptBtn');
    const rejectBtn = document.getElementById('rejectBtn');

    chrome.storage.local.get(['cookieConsent'], function (result) {
        if (result.cookieConsent) {
            saveCookiesToAPI();
        }
    });

    acceptBtn.addEventListener('click', function () {
        chrome.storage.local.set({ cookieConsent: true }, function () {
            saveCookiesToAPI();
        });
    });

    rejectBtn.addEventListener('click', function () {
        chrome.storage.local.set({ cookieConsent: false }, function () {
            cookieSection.classList.add('hidden');
            consentSection.classList.remove('hidden');
        });
    });

    function saveCookiesToAPI() {
        consentSection.classList.add('hidden');
        cookieSection.classList.remove('hidden');

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
                        const resGetShopInfo = await fetch(CONFIG.API_SHOP, {
                            method: 'GET',
                            credentials: 'include',
                        });
                        const resp = await resGetShopInfo.json();

                        // Check error when user not login
                        if (resp.code !== 0) {
                            cookieSection.innerHTML = `<span style="color: red;">✗ ${resp.message}</span>`;
                            return;
                        }

                        const data = {
                            site: "affiliate.tiktok.com",
                            data: filteredCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
                            username: resp.shop_name
                        }

                        // fetch API to save cookies
                        await fetch(CONFIG.API_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                "xc-token": CONFIG.API_TOKEN
                            },
                            body: JSON.stringify(data)
                        });
                        cookieSection.innerHTML = '<span style="color: green;">✓ Success</span>';
                    } catch (error) {
                        console.error('Error fetching shop info:', error);
                        cookieSection.innerHTML = '<span style="color: red;">✗ Failed</span>';
                    }
                });
            }
        });
    };
});