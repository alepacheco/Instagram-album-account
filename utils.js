const sendPic = async (ig, path) => {
    // TODO filter good exension
    console.log(path)
    const { latitude, longitude, searchQuery } = {
        latitude: 0.0,
        longitude: 0.0,
        // not required
        searchQuery: 'place',
    };

    const locations = await ig.search.location(latitude, longitude, searchQuery);
    /**
     * Get the first venue
     * In the real world you would check the returned locations
     */
    const mediaLocation = locations[0];

    const { status } = await ig.publish.photo({
        // read the file into a Buffer
        file: await Bluebird.fromCallback(cb => fs.readFile(path, cb)),
        location: mediaLocation,
        caption: 'my caption',
        usertags: {
            in: [
                // tag the user 'instagram' @ (0.5 | 0.5)
                await generateUsertagFromName(ig, 'instagram', 0.5, 0.5),
            ],
        },
    });

    console.log(publishResult);
}

async function generateUsertagFromName(ig, name, x, y) {
    const clamp = (value, min, max) => Math.max(Math.min(value, max), min);

    // constrain x and y to 0..1 (0 and 1 are not supported)
    x = clamp(x, 0.0001, 0.9999);
    y = clamp(y, 0.0001, 0.9999);
    // get the user_id (pk) for the name
    const { pk } = await ig.user.searchExact(name);
    return {
        user_id: pk,
        position: [x, y],
    };
}
const sendMessage = async (ig, user, message) => {
    const userId = await ig.user.getIdByUsername(user);
    const thread = ig.entity.directThread([userId.toString()]);
    await thread.broadcastText(message);
}
const postRandomPic = async (ig, caption = '') => {
    const imageRequest = await get({
      url: 'https://picsum.photos/800/800', // random picture with 800x800 size
      encoding: null, // this is required, we could convert body to buffer only with null encoding
    });
  
    const publishResult = await ig.publish.photo({
      file: imageRequest, // image buffer, you also can specify image from your disk using fs
      caption,
    });
  
  }
const sendPicFolder = async (ig, folder) => {
    const requests = [];
    fs.readdir(folder, async (err, files) => {
        files.forEach(file => {
            requests.push(sendPic(ig, `${folder}${file}`));
        });

        await Promise.all(requests);
    });
}

module.export = {
    sendMessage
}