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
                chrome.cookies.getAll({ domain: url.hostname }, function (cookies) {
                    const cookiesData = cookies.map(cookie => ({
                        name: cookie.name,
                        domain: cookie.domain,
                        path: cookie.path,
                        secure: cookie.secure,
                        httpOnly: cookie.httpOnly,
                        url: url.href
                    }));
                    fetch(CONFIG.API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "xc-token": CONFIG.API_TOKEN
                        },
                        body: JSON.stringify(cookiesData)
                    })
                        .then(response => response.json())
                        .then(data => {
                            cookieSection.innerHTML = '<span style="color: green;">✓ Đã lưu tất cả cookie vào database</span>';
                        })
                        .catch(error => {
                            cookieSection.innerHTML = '<span style="color: red;">✗ Lỗi khi lưu cookie vào database</span>';
                        });
                });
            }
        });
    };
});