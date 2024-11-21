const moment = require('moment-timezone');

module.exports.antiDelete = async (message, conn, chatData) => {
  if (message) {
    if (!chatData) {
      chatData = false;
    }
    try {
      const messageCache = global.dbc;
      const messageEntry = messageCache.find(entry => entry.id == chatData.id);
      const messageInfo = messageEntry.m;
      const participantId = messageInfo.key.remoteJid.endsWith("@g.us") ? messageInfo.key.participant : messageInfo.key.remoteJid;
      const chatId = messageInfo.key.remoteJid;

      await conn.sendMessage(chatId, {
        'text': "「 *ANTI DELETE MESSAGE* 」\n    \n📛 *Name* : " + messageInfo.pushName + "\n👤 *User* : @" + messageInfo.sender.split('@')[0] + "\n⏰ *Clock* : " + moment.tz("Asia/Makassar").format("HH:mm:ss") + " WITA \n✍️ *MessageType* : " + messageInfo.mtype + "\n    ",
        'mentions': [participantId]
      }, {
        'quoted': messageInfo
      });

      await conn.copyNForward(chatId, messageInfo, true);
      await delay(4000);

      for (let [index, entry] of messageCache.entries()) {
        if (entry.id === chatData.id) {
          messageCache.splice(index, 1);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};
