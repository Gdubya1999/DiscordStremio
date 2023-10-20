require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer-core');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,

  ],
  //token: process.env.DISCORD_BOT_TOKEN
});

let browser;

client.once('ready', async () => {
  browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null,
    args: ['--start-maximized'],
  });
  console.log('Bot and browser are online!');
});

const userPages = new Map();

async function handleMovie(message, searchQuery, indexParam, userPages, browser) {
  try {
    const userId = message.author.id;
    const page = await browser.newPage();
    userPages.set(userId, page);

    // Capitalize the first letter of each word in the movie title
    searchQuery = searchQuery.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());


    await page.goto(`https://web.stremio.com/#/search?search=${searchQuery}`);
    await page.waitForSelector(`[title="${searchQuery}"]:not([href*="series"])`);
    const movieElement = await page.$(`[title="${searchQuery}"]:not([href*="series"])`);
    await movieElement.click();
    await page.screenshot({ path: 'screenshot.png' });

    await page.waitForSelector('.runtime-label-B29EN');
    const runtimeText = await page.$eval('.runtime-label-B29EN', el => el.innerText);
    const runtimeMinutes = parseInt(runtimeText.replace(' min', ''), 10);
    const runtimeMilliseconds = runtimeMinutes * 60 * 1000 + 60000;

    await page.waitForSelector('.select-input-container-irGn_');
    const streamDropdown = await page.$('.select-input-container-irGn_');
    await streamDropdown.click();

    await page.waitForSelector('[title="Torrentio"]');
    const torrentioOptions = await page.$$('[title="Torrentio"]');
    if (torrentioOptions.length > 1) {
      await torrentioOptions[1].click();
    } else {
      console.log("Couldn't find multiple 'Torrentio' options.");
    }

    await page.waitForSelector('.stream-container-JPdah');
    const streams = await page.$$('.stream-container-JPdah');
    if (streams.length > indexParam) {
      await streams[indexParam].click();
    } else {
      console.log("Couldn't find enough streams to match the index.");
    }

    await page.evaluate(() => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    });

    await page.waitForSelector('video');
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = 0;
      } else {
        console.error("Video element not found");
      }
    });

    setTimeout(() => {
      page.close();
    }, runtimeMilliseconds);

  } catch (error) {
    console.error(`Error in handleMovie: ${error}`);
  }
}

async function handleTvSeries(message, searchQuery, indexParam, userPages, browser) {
  try {
    const userId = message.author.id;
    const page = await browser.newPage();
    userPages.set(userId, page);

    // Capitalize the first letter of each word in the TV series title
    searchQuery = searchQuery.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());


    await page.goto(`https://web.stremio.com/#/search?search=${searchQuery}`);
    await page.waitForSelector(`[title="${searchQuery}"][href*="series"]`);
    const tvElement = await page.$(`[title="${searchQuery}"][href*="series"]`);
    await tvElement.click();
    await page.screenshot({ path: 'screenshot_tv.png' });

    await page.waitForSelector('.runtime-label-B29EN');
    const runtimeText = await page.$eval('.runtime-label-B29EN', el => el.innerText);
    const runtimeMinutes = parseInt(runtimeText.replace(' min', ''), 10);
    const runtimeMilliseconds = runtimeMinutes * 60 * 1000 + 60000;

    await page.waitForSelector('.select-input-container-irGn_');
    const streamDropdown = await page.$('.select-input-container-irGn_');
    await streamDropdown.click();

    await page.waitForSelector('[title="Torrentio"]');
    const torrentioOptions = await page.$$('[title="Torrentio"]');
    if (torrentioOptions.length > 1) {
      await torrentioOptions[1].click();
    } else {
      console.log("Couldn't find multiple 'Torrentio' options.");
    }

    await page.waitForSelector('.stream-container-JPdah');
    const streams = await page.$$('.stream-container-JPdah');
    if (streams.length > indexParam) {
      await streams[indexParam].click();
    } else {
      console.log("Couldn't find enough streams to match the index.");
    }

    await page.evaluate(() => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    });

    await page.waitForSelector('video');
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = 0;
      } else {
        console.error("Video element not found");
      }
    });

    setTimeout(() => {
      page.close();
    }, runtimeMilliseconds);

  } catch (error) {
    console.error(`Error in handleTvSeries: ${error}`);
  }
}

async function handlePause(message, userId) {
  const page = userPages.get(userId);
  if (page) {
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) video.pause();
    });
  }
}

async function handlePlay(message, userId) {
  const page = userPages.get(userId);
  if (page) {
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) video.play();
    });
  }
}

async function handleBack(message, userId, secondsToRewind) {
  const page = userPages.get(userId);
  if (page) {
    // Default to 10 seconds if secondsToRewind is not provided or is NaN
    secondsToRewind = (!isNaN(secondsToRewind)) ? secondsToRewind : 10;

    await page.evaluate((secondsToRewind) => {
      const video = document.querySelector('video');
      if (video) video.currentTime -= secondsToRewind;
    }, secondsToRewind);
  }
}

async function handleQuit(message, userId) {
  const page = userPages.get(userId);
  if (page) {
    await page.close();
  }
}

client.on('messageCreate', async (message) => {
  try {
    const userId = message.author.id;

    if (message.author.bot) return;

    let indexParam = 0;
    let command = message.content.split(' ')[1];
    let parts = message.content.split(' ').slice(2);
    let searchQuery = parts.join(' ');

    if (!isNaN(parseInt(parts[parts.length - 1], 10))) {
      indexParam = parseInt(parts.pop(), 10);
      searchQuery = parts.join(' ');
    }

    if (message.content.toLowerCase().startsWith('/lookup movie ')) {
      await handleMovie(message, searchQuery, indexParam, userPages, browser);
    } else if (message.content.toLowerCase().startsWith('/lookup tv ')) {
      await handleTvSeries(message, searchQuery, indexParam, userPages, browser);
    } else if (message.content.toLowerCase() === '/lookup pause') {
      await handlePause(message, userId);
    } else if (message.content.toLowerCase() === '/lookup play') {
      await handlePlay(message, userId);
    } else if (message.content.toLowerCase().startsWith('/lookup back')) {
      let parts = message.content.split(' ');
      let maybeSeconds = parseInt(parts[2], 10);
      await handleBack(message, userId, maybeSeconds);
    } else if (message.content.toLowerCase() === '/lookup quit' || message.content.toLowerCase() === '/lookup exit') {
      await handleQuit(message, userId);
    }
  } catch (error) {
    console.error(`Error in messageCreate: ${error}`);
  }
});

client.on('error', console.error);


client.login(process.env.DISCORD_BOT_TOKEN);

