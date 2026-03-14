/**
 * iyzico Checkout Form servisi - Bakiye yükleme için
 * Sandbox: https://sandbox-api.iyzipay.com
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Iyzipay = require("iyzipay");

let iyzipayInstance = null;
const getIyzipay = () => {
  if (!iyzipayInstance) {
    iyzipayInstance = new Iyzipay({
      apiKey: process.env.IYZIPAY_API_KEY || "",
      secretKey: process.env.IYZIPAY_SECRET_KEY || "",
      uri: process.env.IYZIPAY_URI || "https://sandbox-api.iyzipay.com",
    });
  }
  return iyzipayInstance;
};

/**
 * Checkout Form başlat - iyzico ödeme sayfasına yönlendirme için token/URL döner
 * @param {Object} params - { userId, amount, user: { name, email, phone? } }
 * @param {string} callbackUrl - Ödeme sonrası iyzico'nun yönlendireceği URL (HTTPS gerekli)
 */
export const initializeCheckoutForm = (params, callbackUrl) => {
  return new Promise((resolve, reject) => {
    const { userId, amount, user } = params;
    const priceStr = String(Number(amount).toFixed(2));
    const conversationId = `topup-${userId}-${Date.now()}`;
    const basketId = `B${Date.now()}`;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: priceStr,
      paidPrice: priceStr,
      currency: Iyzipay.CURRENCY.TRY,
      basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id: userId,
        name: (user?.name || "Müşteri").split(" ")[0] || "Müşteri",
        surname: (user?.name || " ").split(" ").slice(1).join(" ") || "Kullanıcı",
        gsmNumber: user?.phone || "+905350000000",
        email: user?.email || "test@test.com",
        identityNumber: "11111111111",
        registrationAddress: "Türkiye",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: {
        contactName: user?.name || "Müşteri",
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
        zipCode: "34000",
      },
      billingAddress: {
        contactName: user?.name || "Müşteri",
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
        zipCode: "34000",
      },
      basketItems: [
        {
          id: "BI001",
          name: "Cüzdan Bakiye Yükleme",
          category1: "Dijital",
          category2: "Bakiye",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: priceStr,
        },
      ],
    };

    getIyzipay().checkoutFormInitialize.create(request, (err, result) => {
      if (err) return reject(err);
      if (result?.status !== "success") {
        return reject(new Error(result?.errorMessage || "iyzico başlatılamadı"));
      }
      resolve({
        token: result.token,
        paymentPageUrl: result.paymentPageUrl,
        checkoutFormContent: result.checkoutFormContent,
        conversationId,
      });
    });
  });
};

/**
 * 3D Secure ödeme başlat - kart bilgileriyle
 * @param {Object} params - { userId, amount, user, card: { cardHolderName, cardNumber, expireMonth, expireYear, cvc } }
 * @param {string} callbackUrl
 */
export const initiate3DSPayment = (params, callbackUrl) => {
  return new Promise((resolve, reject) => {
    const { userId, amount, user, card } = params;
    const priceStr = String(Number(amount).toFixed(2));
    const conversationId = `topup3d-${userId}-${Date.now()}`;
    const basketId = `B${Date.now()}`;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: priceStr,
      paidPrice: priceStr,
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      paymentCard: {
        cardHolderName: card.cardHolderName,
        cardNumber: card.cardNumber.replace(/\s/g, ''),
        expireMonth: card.expireMonth,
        expireYear: card.expireYear,
        cvc: card.cvc,
        registerCard: '0',
      },
      buyer: {
        id: userId,
        name: (user?.name || 'Müşteri').split(' ')[0] || 'Müşteri',
        surname: (user?.name || ' ').split(' ').slice(1).join(' ') || 'Kullanıcı',
        gsmNumber: user?.phone || '+905350000000',
        email: user?.email || 'test@test.com',
        identityNumber: '11111111111',
        registrationAddress: 'Türkiye',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: user?.name || 'Müşteri',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: user?.name || 'Müşteri',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Türkiye',
        zipCode: '34000',
      },
      basketItems: [
        {
          id: 'BI001',
          name: 'Cüzdan Bakiye Yükleme',
          category1: 'Dijital',
          category2: 'Bakiye',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: priceStr,
        },
      ],
    };

    getIyzipay().threedsInitialize.create(request, (err, result) => {
      if (err) return reject(err);
      if (result?.status !== 'success') {
        return reject(new Error(result?.errorMessage || '3DS başlatılamadı'));
      }
      const html = result.htmlContent || result.threeDSHtmlContent || result.checkoutFormContent;
      if (!html) {
        console.error('3DS init result (no htmlContent):', JSON.stringify(result, null, 2));
        return reject(new Error('3DS HTML içeriği alınamadı'));
      }
      resolve({ htmlContent: html, conversationId });
    });
  });
};

/**
 * 3D Secure ödemeyi tamamla (callback'ten sonra çağrılır)
 */
export const complete3DSPayment = (paymentId, conversationData, conversationId) => {
  return new Promise((resolve, reject) => {
    getIyzipay().threedsPayment.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId || 'complete3ds',
        paymentId,
        conversationData,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

/**
 * Ödeme sonucunu iyzico'dan al (callback'te token ile çağrılır)
 */
export const retrieveCheckoutForm = (token) => {
  return new Promise((resolve, reject) => {
    getIyzipay().checkoutForm.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: "retrieve",
        token,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
