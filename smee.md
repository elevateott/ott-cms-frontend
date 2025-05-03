# **📌 Setting Up `smee.io` for Webhook Testing **

This guide explains how to use **`smee.io`** to receive webhooks.

---

## **🔹 What is `smee.io`?**

`smee.io` is a webhook proxy that allows a remote server to send webhooks to your local server, even though it is running on `localhost`.

---

## **🔹 Step 1: Install `smee-client`**

Run the following command to globally install the `smee-client`:

```bash
npm install --global smee-client
```

✅ **This allows you to forward webhooks from `smee.io` to your local server.**

---

## **🔹 Step 2: Start the Webhook Proxy**

Now, run the following command to start listening for webhooks from Mux:

```bash
smee -u https://smee.io/xdcfVCRWdTN9ED --target http://localhost:3000/api/mux/webhook

```

✅ **Breakdown:**

- `-u https://smee.io/xdcfVCRWdTN9ED` → **Your unique webhook proxy URL**.
- `--target http://localhost:1337/api/mux/webhook` → **Where the webhook is forwarded in your local app**.

🚀 **Now, webhooks sent to `smee.io/xdcfVCRWdTN9ED` will be forwarded to your local app!** 🎉
