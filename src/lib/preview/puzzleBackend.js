function callPuzzleBackend(request, key, data, stores, nonce) {
    return request({
        url: "/v1/play/call-puzzle-backend",
        method: "post",
        data: {
            key,
            data,
            stores,
            nonce
        }
    })
}

export default function puzzleBackendFactory(request) {
    let statusStore = {};
    const getStatus = (key) => {
        if (!statusStore[key]) {
            return { status: null, nonce: null };
        }
        return statusStore[key];
    }

    const setStatus = (key, status, nonce) => {
        statusStore[key] = { status, nonce };
    }

    const backend = async (key, data) => {
        let dataString = JSON.stringify(data);

        //get store and nonce
        let { status, nonce } = getStatus(key);
        const response = await callPuzzleBackend(request, key, dataString, status, nonce);
    
        //update store and nonce
        setStatus(key, response.stores, response.nonce);
    
        return JSON.parse(response.data);
    }

    return backend;
}
