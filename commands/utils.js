async function everyone(client, msg) {
  const chat = await msg.getChat();
  if (chat.isGroup) {
    let text = "";
    let mentions = [];

    for (let participant of chat.participants) {
      const contact = await client.getContactById(participant.id._serialized);

      mentions.push(contact);
      text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
  } else {
    msg.reply("This command can only be used in a group!");
  }
}

module.exports = { everyone };
