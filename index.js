import {PushAPI, CONSTANTS} from "@pushprotocol/restapi";
import {ethers} from "ethers";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const PriceBotSigner = new ethers.Wallet(process.env.PRIVATE_KEY);

const PriceBot = await PushAPI.initialize(PriceBotSigner, {
  env: CONSTANTS.ENV.STAGING,
});

const sendMessage = async (token, chatId) => {
  axios
    .get(
      `https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD&api_key=${process.env.CRYPTO_API_KEY}`
    )
    .then(async (response) => {
      if (response.data.Response === "Error") {
        const message = `The token ${token} is not found`;
        await PriceBot.chat.send(chatId, {content: message});
        return;
      }
      const price = response.data.USD;
      const message = `The price of ${token} is $${price}`;
      await PriceBot.chat.send(chatId, {content: message});
    })
    .catch((error) => {
      console.log(error);
    });
};

const stream = await PriceBot.initStream([CONSTANTS.STREAM.CHAT]);
stream.on(CONSTANTS.STREAM.CHAT, async (data) => {
  if (data.event === "chat.message") {
    if (data.message.content.includes("/price")) {
      const token = data.message.content.split(" ")[1];
      sendMessage(token, data.chatId);
    }
  }
});

stream.connect();
