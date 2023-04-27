const axios = require("axios");
const { List } = require("whatsapp-web.js");

var methods = ["Financials"];

async function tt(client, msg, input) {
  axios({
    method: "get",
    url: `https://api.tickertape.in/search?text=${input}`,
    headers: {
      "accept-version": "6.9.2",
    },
  }).then((response) => {
    var data = response.data.data.items;
    var size = Object.keys(data).length;
    if (size > 0) {
      var response = response.data.data.items[0];
      var percentage = (response.quote.change / response.quote.price) * 100;
      percentage = percentage.toFixed(2);
      var final_data = `
    *₹${response.quote.price}*                
    _${response.name}_
    \`\`\`${response.ticker}\`\`\` (_${percentage}_%)
    
Stats: 
High: _₹${response.quote.high}_
Low: _₹${response.quote.low}_
Volume: _${response.quote.volume}_
Market Cap: _₹${Math.round(response.marketCap)}_   

Last Updated- \`\`\`${response.quote.date}\`\`\`
  `;
      let sections = [
        {
          title: response.name,
          rows: [
            { title: ">Financials", description: response.id },
            { title: ">Holdings", description: response.id },
          ],
        },
      ];
      let list = new List(final_data, "More Info", sections);
      msg.reply(list);
    } else {
      return "Symbol not found";
    }
  });
}

async function info(client, msg) {
  var method = msg.body.split("\n")[0].slice(1);
  // if (method in methods) {
  if (method === "Financials") {
    await financials(client, msg);
  } else if (method === "Holdings") {
    await holdings(client, msg);
  }
  // else {
  //   msg.reply("Invalid method");
  // }
}
// }

async function financials(client, msg) {
  var symbol = msg.body.split("\n")[1];
  axios({
    method: "get",
    url: `https://api.tickertape.in/stocks/summary/${symbol}`,
    headers: {
      "accept-version": "6.9.2",
    },
  })
    .then((response) => {
      var response = response.data.data.financialSummary.fiscalYearToData;
      response.forEach(async (year) => {
        await client.sendMessage(
          msg.from,

          ` ${year.year}
  Revenue: ₹${(year.revenue + "").split(".")[0]} Cr.
  Profit: ₹${(year.profit + "").split(".")[0]} Cr.`
        );
      });
    })
    .catch((error) => {});
  // await msg.reply(`Fetching Financials of ${symbol}`);
}

async function holdings(client, msg) {
  var symbol = msg.body.split("\n")[1];
  axios({
    method: "get",
    url: `https://api.tickertape.in/stocks/holdings/${symbol}`,
  })
    .then(async (response) => {
      var response = response.data.data[response.data.data.length - 1];
      await msg.reply(
`Last Update - ${(response.date + "").split("T")[0]}

Total Promoter Holding - *${Number(response.data.pmPctT + "").toFixed(2)}%*
Mutual Funds - *${Number(response.data.mfPctT + "").toFixed(2)}%*
Other Domestic Institutions - *${Number(response.data.othDiPctT + "").toFixed(2)}%*
Foreign Institutions - *${Number(response.data.fiPctT + "").toFixed(2)}%*
Retail and Others - *${Number(response.data.rOthPctT + "").toFixed(2)}%*`
      )
    })
    .catch((error) => {});
}

module.exports = { tt, info };
