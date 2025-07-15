# Solana Memecoin Launchpad

This is the web app hosting Solana Memecoin Launchpad built on top of [**Meteora DBC**](https://docs.meteora.ag/overview/products/dbc/1-what-is-dbc) with **Next.js**. The app is **fully stateless**, relying entirely on direct Solana RPC calls and the **Jupiter public API**—no backend required. All UI elements are built using shadcn/ui so it will be much easier for developers to adapt it to your own needs. 

---

## Getting Started

### 1. Configure Your Launchpad

Set up your token launch configuration at [Meteora](https://launch.meteora.ag/). The resulting config address will be used in the next step.

### 2. Environment Variables

Create a `.env` file in the root of the project with the following structure:

```
DATABASE_URL=postgresql://<your-db-url> # Use only if you want to save any state later.
PINATA_API_KEY=<your-pinata-api-key>
PINATA_API_SECRET=<your-pinata-api-secret>
NEXT_PUBLIC_POOL_CONFIG_KEY=<your-config-key>
NEXT_PUBLIC_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<your-helius-api-key>
```

> ⚠️ **Never commit your `.env` file**—keep it private.

---

### 3. Start the Dev Server

Install dependencies if you haven't:

```
npm install
# or
yarn
```

Then run the app locally:

```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open your browser at [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🧱 Tech Stack

- **Next.js** – React framework  
- **Solana RPC** – direct chain interaction  
- **Jupiter API** – token pricing & swaps  
- **Meteora DBC** – decentralized bonding curves
