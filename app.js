/*
    Defining dependencies
*/

const Discord = require("discord.js");
const client = new Discord.Client();
const moment = require("moment");
const jsonfile = require("jsonfile");
const request = require("request");
const schedule = require("node-schedule");

/*
    Defining files
*/

const currencyDB = "./currencies.json";
const credentials = require("./credentials.json");

/*
    Setting required variables
*/

let prefix = "!";
let delay = 60000;

/*
    Request arguments (temporarily stored here)
*/

let translate = "USD";

/*
    Beginning of the actual script
*/

function requestCrypto(translate, limit) {
    // The layout of the request making it possible to pass two pieces of into into it
    let requestMap =
        "https://api.coinmarketcap.com/v1/ticker/?convert=" +
        translate +
        "&limit=" +
        limit;
    // The actual request requesting info from the API
    try {
        request(requestMap, function (error, response, body) {
            // Parsing the body into an object
            let info = JSON.parse(body);
            let currencies = [];
            // Everything in here will be done for each entry in the currencydb
            info.forEach(function (entry) {
                // Defining the info which will be put into the currencydb
                let id = entry.id;
                let name = entry.name;
                let symbol = entry.symbol;
                let rank = entry.rank;
                let priceUSD = entry.price_usd;
                let priceBTC = entry.price_btc;
                let perc_1h = entry.percent_change_1h;
                let perc_24h = entry.percent_change_24h;
                let perc_7d = entry.percent_change_7d;
                let availablesupply = entry.available_supply;
                let totalsupply = entry.total_supply;
                let marketcapusd = entry.market_cap_usd;

                // Putting the info from above into an object
                currencies = [
                    ...currencies,
                    {
                        id,
                        name,
                        symbol,
                        rank,
                        perc_1h,
                        perc_24h,
                        perc_7d,
                        priceUSD,
                        priceBTC,
                        availablesupply,
                        totalsupply,
                        marketcapusd
                    }
                ];
            });

            // Writing out the updated data into the currencydb (still forEach)
            jsonfile.writeFileSync(currencyDB, currencies, {
                spaces: 2
            });

            // After we put everything into the currencydb, we sort it again
            sortCrypto();
        });
    } catch (err) {
        console.log("Request error: " + err.name);
    }
}

function sortCrypto() {
    // Reading in the currencydb
    let currencies = jsonfile.readFileSync(currencyDB);
    // Sorting the currencies by their number
    currencies.sort(sortNumber);
    // Writing everything back into the currencydb
    jsonfile.writeFileSync(currencyDB, currencies, {
        spaces: 2
    });
}

function sortNumber(a, b) {
    // Actual process of sorting the file
    return b.marketcapusd - a.marketcapusd;
}

function status() {
    // Getting info from the currencydb
    let currencies = jsonfile.readFileSync(currencyDB);
    // Searching the currencydb for "Bitcoin"
    for (let i in currencies) {
        if (currencies[i].name == "Bitcoin") {
            // Setting the bot status to current Bitcoin info
            client.user.setActivity(
                currencies[i].symbol +
                " @ " +
                currencies[i].priceUSD +
                "$ (" +
                currencies[i].perc_24h +
                "% in last 24h)"
            );
        }
    }
}

let refresh0s = schedule.scheduleJob("00 * * * * *", function () {
    requestCrypto(translate, 1500);
    // Also updating status at the same time
    status();
});

let refresh20s = schedule.scheduleJob("20 * * * * *", function () {
    requestCrypto(translate, 1500);
    // Also updating status at the same time
    status();
});

let refresh40s = schedule.scheduleJob("40 * * * * *", function () {
    requestCrypto(translate, 1500);
    // Also updating status at the same time
    status();
});

// Discord bot, returning on command
client.on("message", msg => {
    if (msg.content.toLowerCase().startsWith(prefix + "top")) {
        let currencies_embedded = [];

        let currencies = jsonfile.readFileSync(currencyDB);
        for (let i = 0; i < 12; i++) {
            let indicator1h = "";
            let indicator24h = "";
            let indicator7d = "";
            let emoji = "";
            if (currencies[i].perc_24h >= 0) {
                emoji = ":money_mouth:";
                indicator24h = "+";
            } else {
                emoji = ":rage:";
                indicator24h = "";
            }

            if (currencies[i].perc_7d >= 0) {
                indicator7d = "+";
            } else {
                indicator7d = "";
            }

            if (currencies[i].perc_1h >= 0) {
                indicator1h = "+";
            } else {
                indicator1h = "";
            }

            currencies_embedded.push({
                name:
                    emoji +
                    " __" +
                    currencies[i].name +
                    ":__  (" +
                    currencies[i].rank +
                    ": " +
                    currencies[i].symbol +
                    ")",
                value:
                    "**" +
                    currencies[i].priceUSD +
                    " " +
                    translate +
                    "** " +
                    "\n**7d:** " +
                    indicator7d +
                    currencies[i].perc_7d +
                    "%" +
                    "\n**24h:** " +
                    indicator24h +
                    currencies[i].perc_24h +
                    "%" +
                    "\n**1h:** " +
                    indicator1h +
                    currencies[i].perc_1h +
                    "%",
                inline: true
            });
        }

        let embed = {
            footer: {
                text: "Data pulled at " + moment().format("LTS")
            },
            fields: currencies_embedded
        };

        console.log("| Crypto status requested                            |");

        msg.channel.send(
            "[<@" + msg.author.id + ">] Here are your requested exchange rates!"
        );
        msg.channel.send({
            embed
        });
    }

    if (msg.content.toLowerCase().startsWith(prefix + "s")) {
        let argument = msg.content.substr("!s ".length).toLowerCase();
        console.log(argument);
        if (argument.length > 0) {
            let currencies_embedded = [];

            let currencies = jsonfile.readFileSync(currencyDB);
            let found = false;
            for (let i = 0; i < 1000; i++) {
                if (
                    currencies[i].name.toLowerCase() == argument ||
                    currencies[i].symbol.toLowerCase() == argument
                ) {
                    found = true;
                    let emoji;
                    if (currencies[i].perc_24h >= 0) {
                        emoji = ":money_mouth:";
                        indicator24h = "+";
                    } else {
                        emoji = ":rage:";
                        indicator24h = "";
                    }

                    if (currencies[i].perc_7d >= 0) {
                        indicator7d = "+";
                    } else {
                        indicator7d = "";
                    }

                    if (currencies[i].perc_1h >= 0) {
                        indicator1h = "+";
                    } else {
                        indicator1h = "";
                    }

                    let nf = new Intl.NumberFormat();

                    currencies_embedded.push({
                        name:
                            emoji +
                            " | " +
                            currencies[i].name +
                            " | " +
                            currencies[i].symbol +
                            " | " +
                            currencies[i].rank +
                            " | ",
                        value:
                            "**" +
                            currencies[i].priceUSD +
                            " " +
                            translate +
                            "** " +
                            "\n**7d:** " +
                            indicator7d +
                            currencies[i].perc_7d +
                            "%" +
                            "\n**24h:** " +
                            indicator24h +
                            currencies[i].perc_24h +
                            "%" +
                            "\n**1h:** " +
                            indicator1h +
                            currencies[i].perc_1h +
                            "%" +
                            "\n\n**MCap:** " +
                            nf.format(currencies[i].marketcapusd) +
                            " " +
                            translate +
                            "\n**Available Supply:** " +
                            nf.format(currencies[i].availablesupply) +
                            " " +
                            "\n**Total Supply:** " +
                            nf.format(currencies[i].totalsupply) +
                            " " +
                            "\n\n[CoinMarketCap Link](https://coinmarketcap.com/currencies/" +
                            currencies[i].id +
                            ")",
                        inline: true
                    });

                    let embed = {
                        footer: {
                            text: "Data pulled at " + moment().format("LTS")
                        },
                        fields: currencies_embedded
                    };

                    console.log("Crypto status requested ");

                    msg.channel.send({
                        embed
                    });
                }
            }
            if (found == false) {
                msg.channel.send("Coin not found!");
            }
        } else {
            msg.channel.send("Please use the correct format.");
        }
    }
});

client.on("ready", function () {
    console.log("CryptoBot online. Values updated every 20 seconds.");

    status();
    setInterval(function () {
        status();
    }, delay);
});

client.login(credentials.discord.token);
