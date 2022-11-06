const WebSocket = require('ws');
const blessed = require('blessed');
const cookie = require('cookie');
const emojiRegex = require('emoji-regex/es2015/index.js');
// Const emojiRegexText = require("emoji-regex/es2015/text.js");
const mpv = require('node-mpv');
const axios = require('axios');
const cheerio = require('cheerio');
const flairs = require('./flairs.json');
const config = require('./config.json');

let watchlist = [];
let showUsers = config.showUsers;
let showTimestamp = config.showTimestamp;
const flairsMap = new Map();
const userMap = new Map();
for (const v of flairs) {
	flairsMap.set(v.name, v);
}

const ws = new WebSocket('wss://chat.destiny.gg/ws', {
	headers: {Cookie: cookie.serialize('authtoken', config.authtoken)},
});

const screen = blessed.screen({
	fastCSR: true,
	title: 'destiny.gg',
	fullUnicode: true,
	sendFocus: true,
});

const chatBox e blessed.box({
	label: 'desi
:;;tiny.gg',
	width: '100%-20',
	height: '100%-3',
	border: {
		type: 'line',
	},
	scrollable: true,
});

const chatLog = blessed.log({
	parent: chatBox,
	tags: true,
	scrollable: true,
	alwaysScroll: false,
	scrollOnInput: false,
	mouse: true,
	keys: true,
});

const inputBox = blessed.box({
	label: `Write something ${config.username}...`,
	bottom: '0',
	width: '100%-20',
	height: 3,
	border: {
		type: 'line',
	},
});

const input = blessed.textbox({
	parent: inputBox,
	inputOnFocus: true,
});

const userBox = blessed.box({
	label: 'Users',
	right: '0',
	width: 20,
	height: '100%',
	border: {
		type: 'line',
	},
});

userList = blessed.list({
	parent: userBox,
	tags: true,
	scrollable: true,
	alwaysScroll: true,
	mouse: true,
	keys: true,
	invertSelected: false,
});

// Runs on opening of the websocket
ws.on('open', function open() {
	chatLog.log('{cyan-fg}Connected.{/}');
});

// Runs on each message received by the websocket
ws.on('message', function incoming(data) {
	// FORMAT OF DATA:
	// MSG {
	//   "nick":"bird",
	//   "features":["subscriber","flair9"],
	//   "timestamp":1571967272433,
	//   "data":"NO GODSTINY BURN EVERY BRIDGE PEPE"
	// }
	const type = data.split(' ')[0];
	const message = JSON.parse(data.slice(Math.max(0, data.indexOf(' '))));

	// Remove emojis from message
	const regex = emojiRegex();
	let match;
	while ((match = regex.exec(message.data))) {
		const emoji = match[0];
		message.data = message.data.replace(emoji, '[emoji]');
	}

	function findTwitchEmbeds(text) {
		if (!text) {
			return;
		}

		const twitchRegex = /#twitch\/[.?]+/i;
		return text.replace(twitchRegex, text => ('www.twitch.tv/' + text.split('/')[1]));
		   }

	function findYoutubeEmbeds(text) {
		const youtubeRegex = /#youtube\/[.?]+/i;
	 if (!text) {
			return;
		}

		return text.replace(youtubeRegex, text => ('www.youtube.com/watch?v=' + text.split('/')[1]));
	}

	// Const re = new RegExp(/#youtube\/, 'i');
	const youtubeRegex = /#youtube\//i;
	// Msg.data = msg.data.replace(youtubeRegex, "www.youtube.com/watch?v=");
	message.data = findTwitchEmbeds(message.data);
	message.data = findYoutubeEmbeds(message.data);

	// First packet sent by server, used to fill user list
	if (type === 'NAMES') {
		for (const user of message.users) {
			userMap.set(user.nick, user);
		}

		let userName;
		for (const user of message.users.sort(userComparator)) {
			const userFeatures = (user.features || [])
				.filter(e => flairsMap.has(e))
				.map(e => flairsMap.get(e))
				.sort((a, b) => (a.priority < b.priority ? 1 : -1))
				.reduce((string_, e) => e.color, '');

			userName = userFeatures ? `{${userFeatures}-fg}${user.nick}{/}` : user.nick;

			userList.add(userName);
		}

		chatLog.log(
			`Serving {cyan-fg}${message.connectioncount}{/} connections and {cyan-fg}${message.users.length}{/} users.`,
		);
	}

	if (type === 'MSG') {
		let name; let data;

		if (
			message.data.toLowerCase().includes('nsfw')
      || message.data.toLowerCase().includes('nsfl')
		) {
			data = `{red-fg}${message.data}{/}`;
		} else {
			data = message.data;
		}

		const features = (message.features || [])
			.filter(e => flairsMap.has(e))
			.map(e => flairsMap.get(e))
			.sort((a, b) => (a.priority < b.priority ? 1 : -1))
			.reduce((string_, e) => e.color, '');

		name = features ? `{${features}-fg}{bold}${message.nick}{/}` : `{bold}${message.nick}{/}`;

		if (message.data[0] === '>') {
			data = `{green-fg}${data}{/}`;
		}

		// Added highlighting for mentions
		if (message.data.includes(config.username)) {
			data = `{#9eb5db-bg}${data}{/}`;
		}

		if (watchlist.includes(message.nick)) {
			data = `{underline}${data}{/underline}`;
		}

		if (showTimestamp) {
			const timestamp = new Date(message.timestamp).toUTCString();
			chatLog.log('[' + timestamp + '] ' + name + ': ' + data);
		} else {
			chatLog.log(name + ': ' + data);
		}
	}
});

<<<<<<< HEAD
input.key('enter', () => {
	const text = input.getValue();
	if (text === '/users' && showUsers) {
		screen.remove(userBox);
		inputBox.width = '100%';
		chatBox.width = '100%';
		showUsers = false;
	} else if (text === '/users' && !showUsers) {
		screen.append(userBox);
		inputBox.width = '100%-20';
		chatBox.width = '100%-20';
		showUsers = true;
	} else if (text === '/timestamps') {
		showTimestamp = !showTimestamp;
	} else if (text.includes('/watch')) {
		watchlist.push(text.split(' ')[1]);
	} else if (text.includes('/unwatch')) {
		watchlist = watchlist.filter((value, index, array) => value !== text.split(' ')[1]);
	} else if (text === '/quit' || text === '/exit') {
		process.exit(0);
	} else if (text === '/livestream' || text === '/ls') {
	  const mpv_player = new mpv();
=======
input.key("enter", () => {
  const text = input.getValue();
  if (text === "/users" && showUsers) {
    screen.remove(userBox);
    inputBox.width = "100%";
    chatBox.width = "100%";
    showUsers = false;
  } else if (text === "/users" && !showUsers) {
    screen.append(userBox);
    inputBox.width = "100%-20";
    chatBox.width = "100%-20";
    showUsers = true;
  } else if (text === "/timestamps") {
    showTimestamp = !showTimestamp;
  } else if (text.includes("/watch")) {
    watchlist.push(text.split(" ")[1]);
  } else if (text.includes("/unwatch")) {
    watchlist = watchlist.filter(function(value, index, arr){
    return value !== text.split(" ")[1];
    });
  } else if (text === "/quit" || text === "/exit") {
  process.exit(0);
  } else if (text === "/livestream" || text === "/ls") {
	  let mpv_player = new mpv(["--no-taskbar-progress"]);
>>>>>>> 8ba52ab9048e847f7d9dc4197e24a300ab0eb254
	  try {
	  mpv_player.load('https://www.youtube.com/user/destiny/live');
			chatLog.log('{yellow-fg}Launching stream!{/}');
	  } catch {
			chatLog.log('ERROR: STREAM NOT FOUND');
	  }
	} else {
		send('MSG', {data: text});
	}

	input.clearValue();
	input.focus();
});

const send = (eventname, data) => {
	const payload = typeof data === 'string' ? data : JSON.stringify(data);
	ws.send(`${eventname} ${payload}`);
};

const userComparator = (a, b) => {
	const u1 = userMap.get(a.nick);
	const u2 = userMap.get(b.nick);
	if (!u1 || !u2) {
		return 0;
	}

	let v1; let v2;

	v1 = u1.features.includes('admin') || u1.features.includes('vip');
	v2 = u2.features.includes('admin') || u2.features.includes('vip');
	if (v1 > v2) {
		return -1;
	}

	if (v1 < v2) {
		return 1;
	}

	v1 = u1.features.includes('flair11');
	v2 = u2.features.includes('flair11');
	if (v1 > v2) {
		return 1;
	}

	if (v1 < v2) {
		return -1;
	}

	v1 = u1.features.includes('bot');
	v2 = u2.features.includes('bot');
	if (v1 > v2) {
		return 1;
	}

	if (v1 < v2) {
		return -1;
	}

	v1 = u1.features.includes('flair12') || u1.features.includes('flair12');
	v2 = u2.features.includes('flair12') || u2.features.includes('flair12');
	if (v1 > v2) {
		return -1;
	}

	if (v1 < v2) {
		return 1;
	}

	v1 = u1.features.includes('subscriber') || u1.features.includes('subscriber');
	v2 = u2.features.includes('subscriber') || u2.features.includes('subscriber');
	if (v1 > v2) {
		return -1;
	}

	if (v1 < v2) {
		return 1;
	}

	const u1Nick = u1.nick.toLowerCase();
	const u2Nick = u2.nick.toLowerCase();

	if (u1Nick < u2Nick) {
		return -1;
	}

	if (u1Nick > u2Nick) {
		return 1;
	}

	return 0;
};

input.key(['C-c'], () => process.exit(0));
input.key(['C-n'], () => input.focus());
input.key(['upArrow'], () => chatBox.scroll(20));
input.key(['downArrow'], () => chatBox.scroll(-20));
input.key(['C-r'], () => {
	outputStreamStatus();
	//	Const {data} = axios.get('https://www.destiny.gg');
	//	chatLog.log(data);
	//	const nn = cheerio.load(data);
	//	const outstr = [];

//	console.log(nn('div.stream-status').class());
});

const outputStreamStatus = async () => {
	try {
		const {data} = await axios.get('https://www.destiny.gg');
		const $ = cheerio.load(data);
		const strmStatus = [];

		const stat = $('#stream-status-title').text();
		chatLog.log(`{yellow-fg}${stat}{/}`);
	} catch (error) {
		throw error;
	}
};

screen.append(chatBox);
screen.append(inputBox);
screen.append(userBox);

screen.render();

input.focus();

chatLog.log('{cyan-fg}Connecting to destiny.gg ...{/}');
if (!config.showUsers) {
	screen.remove(userBox);
	inputBox.width = '100%';
    	chatBox.width = '100%';
	showUsers = false;
}
