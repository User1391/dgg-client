const WebSocket = require("ws");
const chalk = require("chalk");
const log = console.log;

const ws = new WebSocket("wss://www.destiny.gg/ws");

// runs on opening of the websocket
ws.on("open", function open() {
  log(chalk.cyan(`Connected.`));
});

// runs on each message received by the websocket
ws.on("message", function incoming(data) {
  // FORMAT OF DATA:
  // MSG
  // {
  //   "nick":"bird",
  //   "features":["subscriber","flair9"],
  //   "timestamp":1571967272433,
  //   "data":"NO GODSTINY BURN EVERY BRIDGE PEPE"
  // }
  const type = data.split(" ")[0];
  let msg = JSON.parse(data.substring(data.indexOf(" ")));
  let feats = [];
  if (type === "NAMES") {
    // msg.users.forEach(user => {
    //   user.features.forEach(feat => {
    //     if (!feats.includes(feat)) {
    //       feats.push(feat);
    //     }
    //   });
    // });
    log(`Serving ${chalk.cyan(msg.connectioncount)} connections and ${chalk.cyan(msg.users.length)} users.`)
  }
  if (type === "MSG") {
    if (msg.features.includes("admin")) {
      log(`${chalk.red.bold(msg.nick)}: ${msg.data}`);
      return;
    }
    if (msg.features.includes("flair12")) {
      log(`${chalk.yellow.bold(msg.nick)}: ${msg.data}`);
      return;
    }
    if (msg.features.includes("bot")) {
      log(`🤖 ${chalk.dim(msg.nick)}: ${chalk.dim(msg.data)}`);
      return;
    }
    if (msg.features.includes("protected")) {
      log(`✔ ${chalk.blue.bold(msg.nick)}: ${msg.data}`);
      return;
    }
    if (msg.features.includes("subscriber")) {
      log(`${chalk.blue.bold(msg.nick)}: ${msg.data}`);
      return;
    }
    log(`${chalk.bold(msg.nick)}: ${msg.data}`);
  }
});

log(chalk.cyan(`Connecting to destiny.gg ...`))
