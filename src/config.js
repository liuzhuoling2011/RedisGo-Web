// const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'

// let server = '47.52.140.130:8080'
let server = '127.0.0.1:51299'

export default {
    // base_url: location.origin,
    // ws_url: `${wsProtocol}//${location.host}/ws`,
    base_url: `http://${server}`,
    ws_url: `ws://${server}/ws`,
};
