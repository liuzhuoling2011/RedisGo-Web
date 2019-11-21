import axios from "axios";

const wsProtocol = location.protocol === 'http:' ? 'ws:' : 'wss:'
let server = '47.52.140.130:8080'
let local = '127.0.0.1:51299'

let config = {
    'local': { base_url: `http://${local}`, ws_url: `ws://${local}/ws`},
    'dev': { base_url: `http://${server}`, ws_url: `ws://${server}/ws`},
    'prod': { base_url: location.origin, ws_url: `${wsProtocol}//${location.host}/ws`},
}

// let env = 'local'
// let env = 'dev'
let env = 'prod'

export default {
    base_url: config[env].base_url,
    ws_url: config[env].ws_url,
    myaxios: axios.create({baseURL: config[env].base_url})
};