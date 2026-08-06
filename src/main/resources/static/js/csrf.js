(function () {
    'use strict';

    const originalFetch = window.fetch.bind(window);

    let csrfInfoPromise = null;

    function isUnsafeMethod(method) {
        return ['POST', 'PUT', 'PATCH', 'DELETE']
            .includes(method.toUpperCase());
    }

    function readCookie(name) {
        const cookies = document.cookie
            ? document.cookie.split('; ')
            : [];

        const target = cookies.find(cookie =>
            cookie.startsWith(name + '=')
        );

        if (!target) {
            return null;
        }

        return decodeURIComponent(
            target.substring(name.length + 1)
        );
    }

    async function loadCsrfInfo() {

        const response = await originalFetch('/api/csrf', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(
                'CSRF 토큰을 가져오지 못했습니다.'
            );
        }

        return response.json();
    }



    window.fetch = async function (input, init = {}) {
        const request = input instanceof Request ? input : null;

        const method = (
            init.method
            || request?.method
            || 'GET'
        ).toUpperCase();

        const options = {
            ...init,
            credentials: init.credentials || 'same-origin'
        };

        if (!isUnsafeMethod(method)) {
            return originalFetch(input, options);
        }

        const csrfInfo = await loadCsrfInfo();

        const headers = new Headers();

        if (request) {
            request.headers.forEach((value, key) => {
                headers.set(key, value);
            });
        }

        if (init.headers) {
            new Headers(init.headers).forEach((value, key) => {
                headers.set(key, value);
            });
        }

        headers.set(
            csrfInfo.headerName,
            csrfInfo.token
        );

        options.method = method;
        options.headers = headers;

        return originalFetch(input, options);
    };

    async function addCsrfToForms() {

        try {
            const csrfInfo = await loadCsrfInfo();

            const forms =
                document.querySelectorAll('form');

            forms.forEach(form => {

                const method = (
                    form.getAttribute('method')
                    || 'GET'
                ).toUpperCase();

                if (!isUnsafeMethod(method)) {
                    return;
                }

                let input = form.querySelector(
                    `input[name="${csrfInfo.parameterName}"]`
                );

                if (!input) {
                    input =
                        document.createElement('input');

                    input.type = 'hidden';
                    input.name =
                        csrfInfo.parameterName;

                    form.appendChild(input);
                }

                input.value =
                    readCookie('XSRF-TOKEN')
                    || csrfInfo.token;
            });

        } catch (error) {
            console.error(
                'CSRF 초기화 실패:',
                error
            );
        }
    }

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            addCsrfToForms
        );

    } else {
        addCsrfToForms();
    }
})();