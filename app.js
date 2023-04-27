const {
  Client,
  Location,
  List,
  Buttons,
  LocalAuth,
  MessageMedia,
} = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const stocks = require("./commands/stocks");
const utils = require("./commands/utils");
var Transmission = require('transmission-promise');
const byteSize = require('byte-size')
const bodyParser = require('body-parser');
const spawn = require("child_process").spawn;


// const pythonProcess = spawn('python3',["/config/workspace/tg/telethon/hello.py"]);


const express = require('express');
const { response } = require("express");
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
const port = 9009

var transmission = new Transmission({
    port: process.env.PORT,			
    host: process.env.IP,		
    username: process.env.USER,	
    password: process.env.PASS	
});

whitelist = {"120363062032584590@g.us":"01", "120363047598711454@g.us":"debug", "120363069712368512@g.us":"02"}
var uploaded1h=0;
var uploaded4h=0;
var uploaded12h=0;
var uploaded24h=0;
var downloaded24h=0;

transmission.sessionStats().then(res => {
  uploaded1h=res['cumulative-stats']['uploadedBytes']
  uploaded4h=res['cumulative-stats']['uploadedBytes']
  uploaded12h=res['cumulative-stats']['uploadedBytes']
  uploaded24h=res['cumulative-stats']['uploadedBytes']
  downloaded24h=res['cumulative-stats']['downloadedBytes']
})

var variables = [
  "btcusdt",
  "ethusdt",
  "ltcusdt",
  "linkusdt",
  "dotusdt",
  "vetusdt",
];

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true,
  args: [
      '--no-sandbox'
  ] 
},
});

client.initialize();

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", () => {
  console.log("READY");

  setInterval(function(){
    transmission.sessionStats().then(res =>{
    client.sendMessage("120363024657545337@g.us", `
Downloaded: ${byteSize(res['cumulative-stats']['downloadedBytes'], {precision: 2})}
Uploaded: ${byteSize(res['cumulative-stats']['uploadedBytes'], {precision: 2})}

*1H Upload: ${byteSize(res['cumulative-stats']['uploadedBytes']-uploaded1h, {precision: 2})}*`, {sendSeen:false})

    uploaded1h=res['cumulative-stats']['uploadedBytes'];
})}, 1*60*60*1000)

setInterval(function(){
  transmission.sessionStats().then(res =>{
  client.sendMessage("120363024657545337@g.us", `
Downloaded: ${byteSize(res['cumulative-stats']['downloadedBytes'], {precision: 2})}
Uploaded: ${byteSize(res['cumulative-stats']['uploadedBytes'], {precision: 2})}

*4H Upload: ${byteSize(res['cumulative-stats']['uploadedBytes']-uploaded4h, {precision: 2})}*`, {sendSeen:false})

  uploaded4h=res['cumulative-stats']['uploadedBytes'];
})}, 4*61*60*1000)

  setInterval(function(){
  transmission.sessionStats().then(res =>{
  client.sendMessage("120363024657545337@g.us", `
Downloaded: ${byteSize(res['cumulative-stats']['downloadedBytes'], {precision: 2})}
Uploaded: ${byteSize(res['cumulative-stats']['uploadedBytes'], {precision: 2})}

*12H Upload: ${byteSize(res['cumulative-stats']['uploadedBytes']-uploaded12h, {precision: 2})}*`, {sendSeen:false})

  uploaded12h=res['cumulative-stats']['uploadedBytes'];
})}, 12*61*61*1000)

  setInterval(function(){
  transmission.sessionStats().then(res =>{
  client.sendMessage("120363024657545337@g.us", `
Torrent Count: ${res.torrentCount}

Downloaded: ${byteSize(res['cumulative-stats']['downloadedBytes'], {precision: 2})}
Uploaded: ${byteSize(res['cumulative-stats']['uploadedBytes'], {precision: 2})}

*24H Upload: ${byteSize(res['cumulative-stats']['uploadedBytes']-uploaded24h, {precision: 2})}*
*24H Download: ${byteSize(res['cumulative-stats']['downloadedBytes']-downloaded24h, {precision: 2})}*`, {sendSeen:false})

  uploaded24h=res['cumulative-stats']['uploadedBytes'];
  downloaded24h=res['cumulative-stats']['downloadedBytes'];
})}, 24*61*61*1000)

});

  

client.on("message", async (msg) => {
  console.log("MESSAGE RECEIVED");
  // console.log(msg)

  if (msg.body === ".ping reply") {
    msg.reply("pong");
  } else if (msg.body === ".ping") {
    client.sendMessage(msg.from, "pong");
  } else if (msg.body === ".everyone") {
    // await utils.everyone(client, msg);
    const chat = await msg.getChat();
    await msg.reply(chat.participants.map(a => `@${a.id.user} `).join(''), null, {
    mentions: chat.participants
    });
  } else if (msg.body === ".silent") {
    const chat = await msg.getChat();
    await msg.reply('‎', null, {
    mentions: chat.participants
    });
  } else if (msg.body === ".here") {
    const chat = await msg.getChat();
    await msg.reply(chat.participants.map(a => `@${a.id.user} `).join(''), null, {
    mentions: chat.participants
    });
  } else if (msg.body === ".pp") {
    axios
      .get("https://x.wazirx.com/api/v2/tickers/")
      .then((response) => {
        for (logs in response.data) {
          if (variables.indexOf(logs) >= 0) {
            client.sendMessage(
              msg.from,
              `${logs.toUpperCase()} - ${response.data[logs]["last"]} USDT`
            );
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } else if (msg.body.toLowerCase().startsWith(">")) {
    await stocks.info(client, msg);
  } else if (
    msg.from === "919424898941@c.us" ||
    msg.from === "919893376058@c.us"
  ) {
    await stocks.tt(client, msg, msg.body);
  } else if (msg.body === ".v") {
    const chat = await msg.getChat();
    let text = "";
    let mentions = [];
    const media = await MessageMedia.fromUrl(
      "https://cdn.discordapp.com/attachments/887721371315097640/952983113825398854/unknown.png"
    );
    for (let participant of chat.participants) {
      const contact = await client.getContactById(participant.id._serialized);

      mentions.push(contact);
      text += `@${participant.id.user} `;
    }
    await chat.sendMessage(text, { mentions });
    chat.sendMessage(media);
  } else if (msg.body.toLowerCase().startsWith("st ")) {
    var input = msg.body.split(" ")[1];
    await stocks.tt(client, msg, input);
  } else if (msg.body.toLowerCase().startsWith("ask ") && msg.from in whitelist) {
      (async () => {
        require('dotenv').config();
        const { ChatGPTUnofficialProxyAPI } = await import('chatgpt');
    
        const api = new ChatGPTUnofficialProxyAPI({
          accessToken: process.env.SESSION_TOKEN,
          // markdown: false
        });

        var ask = msg.body.substr(msg.body.indexOf(' ') + 1);
        console.log(ask)
        msg.react('🔍')
        const response = await api.sendMessage(ask);
        msg.reply(response.text);
        msg.react('✅')
      })();
      } 

  
});

client.on('message_create', async (msg) => {
//   // Fired on all message creations, including your own
  if (msg.fromMe) {
    if (msg.body === ".sil") {
      const chat = await msg.getChat();
      // await msg.reply(chat.participants.map(a => `@${a.id.user} `).join(''), null, {
      //   mentions: chat.participants
      //   });
      msg.reply('‎', null, {
      mentions: chat.participants
      });
  } else if (msg.body === ".port"){
    axios({
      "method": "get",
      "headers": {
        "Host": "x.wazirx.com",
        "Connection": "keep-alive",
        "sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\", \"Google Chrome\";v=\"108\"",
        "tonce": "1671990532392",
        "sec-ch-ua-mobile": "?0",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        "access-key": "JphxzsBGeHhvlsRhmfJj09tbDYlzjacVjK8A11dpYm8yYg",
        "signature": "fb581fff6750594990582179c850eaa742dfecae97fcca97b0c9c81e5432ce41",
        "api-key": "WRXPRODWn5Kc36$#%WYjguL;1oUYnD9ijiIHE7bk3r78%3#mFHJdik3n1Uafgib98*GI",
        "platform": "web",
        "timezone": "Asia/Calcutta",
        "isBrowser": "true",
        "sec-ch-ua-platform": "\"macOS\"",
        "Accept": "*/*",
        "Origin": "https://wazirx.com",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://wazirx.com/",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8"
      }
    }).then((response)=>{
      console.log(response)
    })
  }
    // else if (msg.body === ".total"){
    //   console.log(".total rcvd")
    //   pythonProcess.stdout.on('data', (sss) => {
    //     msg.reply(sss)
    //     console.log(sss.toString())
    //    });
    // }
}});

client.on("message_revoke_everyone", async (after, before) => {
  // if (before) {
    const contact = await before.getContact();
  //   client.sendMessage(
  //     after.from,
  //     `@${contact.id.user}'s message was deleted,
        
  //       ${before.body}`,
  //     { mentions: [contact] }
  //   );
  // }
  if (before.type === 'chat') {
    const contact = await before.getChat();
    // console.log(before)
    console.log("\n\n\n\n\n")
    // console.log(after)
    console.log(contact)

  }
  
});

client.on("message_ack", (msg, ack) => {
  if (ack == 3) {
  }
});

client.on("change_state", (state) => {
  console.log("CHANGE STATE", state);
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

app.post('/smc', async function (req, res) {
  console.log(`SMC Req RCVD.`)
  console.log(req.body)
  client.sendMessage('120363044421639059@g.us', req.body, {sendSeen: false})
  res.sendStatus(200)

})

app.post('/stonks', async function (req, res) {
  console.log("STONKS.")
  client.sendMessage("120363047208146635@g.us", req.body, {sendSeen: false})
  console.log(req.body)
  res.sendStatus(200)
})

app.post('/spem', async function (req, res) {
  console.log("SPEM.")
  client.sendMessage("120363022792559771@g.us", req.body, {sendSeen: false})
  res.sendStatus(200)
})

app.post('/post', express.json(), async function (req, res) {
  console.log("POST")
  if (req.body.media === 'True') {
    // console.log(req.body.media_url)
    // console.log(req.body.media_text)
    const media = await MessageMedia.fromUrl(req.body.media_url);
    client.sendMessage(req.body.id, media, {caption: req.body.media_text})
  }
  else client.sendMessage(req.body.id, req.body.text, {sendSeen: false})
  res.sendStatus(200)
})

app.get("/", (req, res) => {
res.send(
  '<h1 align="center"><tt>Abhi</tt></h1>'
);
});


app.listen(port, '0.0.0.0', () => {
console.log(`Server Started At ${port}`)
})