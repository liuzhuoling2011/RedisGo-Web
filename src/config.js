import axios from "axios";

const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'
let local = '127.0.0.1:59299/redisgo/v3'

let config = {
    'local': { base_url: `${location.protocol}//${local}`, ws_url: `${wsProtocol}//${local}/ws`},
    'prod': { base_url: `${location.origin}/redisgo/v3`, ws_url: `${wsProtocol}//${location.host}/redisgo/v3/ws`},
}

let env = 'local'
// let env = 'dev'
// let env = 'prod'
export default {
    base_url: config[env].base_url,
    ws_url: config[env].ws_url,
    myaxios: axios.create({baseURL: config[env].base_url})
};
