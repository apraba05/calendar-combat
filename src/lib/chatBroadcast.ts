export const broadcastToChat = async (text: string, title?: string, subtitle?: string) => {
  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!url || url === 'placeholder_webhook') return;

  const card = {
    cardsV2: [{
      cardId: "combatCard",
      card: {
        header: {
          title: title || "Calendar Combat",
          subtitle: subtitle || "Live Update",
          imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f94a/512.gif",
          imageType: "CIRCLE"
        },
        sections: [{
          widgets: [{
            textParagraph: { text }
          }]
        }]
      }
    }]
  };

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card)
    });
  } catch (e) {}
};
