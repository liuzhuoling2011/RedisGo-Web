import axios from "axios";

let prefix = 'redisgo/v3'
const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'
let local = `127.0.0.1:59299/${prefix}`

let config = {
    'local': { base_url: `${location.protocol}//${local}`, ws_url: `${wsProtocol}//${local}/ws`},
    'prod': { base_url: `${location.origin}/${prefix}`, ws_url: `${wsProtocol}//${location.host}/${prefix}/ws`},
}

// let env = 'local'
let env = 'prod'
export default {
    base_url: config[env].base_url,
    ws_url: config[env].ws_url,
    myaxios: axios.create({baseURL: config[env].base_url})
};
