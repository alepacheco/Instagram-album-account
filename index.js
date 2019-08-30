const { IgApiClient } = require('instagram-private-api');
const { get } = require('request-promise');
const sharp = require('sharp');

const username = 'comunity_pics'
const sec = 1000;
const min = 60*sec;

const main = async () => {
  const ig = new IgApiClient();

  ig.state.generateDevice(username);
  await ig.simulate.preLoginFlow();
  const loggedInUser = await ig.account.login(username, '');

  console.log('Logged in');
  process.nextTick(async () => await ig.simulate.postLoginFlow());

  const requestLoop = setInterval(async () => {
    const newMessages = await getUnreadMessages(ig);
    const pics = newMessages.filter(msg => msg.type === 'media');
    await Promise.all(pics.map(({ text, name }) => postUrlPic(ig, text, `New picture by: @${name}`, name)));
  }, 1*min);
}

const getUnreadMessages = async (ig) => {
  const res = await ig.feed.directInbox();

  const records = await res.records();
  const unread = records.filter(({ read_state }) => read_state === 1);
  const simpler = unread.map(msg => ({
    thread_id: msg.thread_id,
    item_id: msg.items[0].item_id,
    type: msg.items[0].item_type,
    text: parseMsg(msg.items[0]),
    name: msg.thread_title,
  }));
  //mark as seen
  await Promise.all(simpler.map(({ thread_id, item_id }) => ig.entity.directThread(thread_id).markItemSeen(item_id)))
  console.log(simpler)
  return simpler;
}

const parseMsg = (msg) => {
  if (msg.item_type === 'text') {
    return msg.text
  }

  if (msg.item_type === 'media') {
    return msg.media.image_versions2.candidates[0].url
  }
}


const postUrlPic = async (ig, url, caption, user) => {
  const imageRequest = await get({
    url,
    encoding: null, // this is required, we could convert body to buffer only with null encoding
  });

  const cropped = await sharp(imageRequest).resize({
    width: 1080,
    height: 1080,
    fit: sharp.fit.cover,
    position: sharp.strategy.entropy
  }).toBuffer();

  const publishResult = await ig.publish.photo({
    file: cropped, // image buffer, you also can specify image from your disk using fs
    caption,
    usertags: {
      in: getTags(ig, ['instagram', username, user])
    }
  });

  return publishResult;
}


const getTags = async(ig, users) => {
  const userIds = await Promise.all(users.map(user => ig.user.getIdByUsername(user)));

  return userIds.map(userId => {
    return {
      user_id: userId,
      position: [getRandomInt(0, 1070), getRandomInt(0, 1070)]
    }
  })
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
main();

