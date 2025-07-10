"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, ImagePlus, Upload, Globe } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputWithAdornment } from "@/components/ui/InputWithAdornment";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN } from "bn.js";

const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;
const telegramRegex = /^https?:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]{5,}$/;
const xRegex = /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}$/;

// Base schema with all fields optional
const baseSchema = z.object({
  name: z.string().optional(),
  ticker: z.string().optional(),
  description: z.string().max(500, "Max 500 characters").optional(),
  website: z.string().regex(urlRegex, "Enter a valid website URL").optional().or(z.literal("")),
  telegram: z.string().regex(telegramRegex, "Enter a valid Telegram link").optional().or(z.literal("")),
  x: z.string().regex(xRegex, "Enter a valid X.com link").optional().or(z.literal("")),
  image: z.any().optional(),
});

// Required schema for when wallet is connected
const requiredSchema = z.object({
  name: z.string().min(2, "Name is required"),
  ticker: z.string().min(1, "Ticker is required").max(10, "Max 10 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
  website: z.string().regex(urlRegex, "Enter a valid website URL").optional().or(z.literal("")),
  telegram: z.string().regex(telegramRegex, "Enter a valid Telegram link").optional().or(z.literal("")),
  x: z.string().regex(xRegex, "Enter a valid X.com link").optional().or(z.literal("")),
  image: z.any().refine(val => val, "Token logo is required"),
});

type BaseFormData = z.infer<typeof baseSchema>;
type RequiredFormData = z.infer<typeof requiredSchema>;
type FormData = BaseFormData | RequiredFormData;


const CreateTokenPageContent = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [poolCreated, setPoolCreated] = useState(false);
  const [showPreBuyCard, setShowPreBuyCard] = useState(false);
  const [preBuyAmount, setPreBuyAmount] = useState<string>("");
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const {
    previewUrl,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({
    onUpload: () => {
      // Optionally handle upload preview URL
    },
  });
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormData>({
    resolver: (values, context, options) => {
      // Use different schema based on connection status
      const schema = connected ? requiredSchema : baseSchema;
      return zodResolver(schema)(values, context, options);
    },
    defaultValues: {
      name: "",
      ticker: "",
      description: "",
      website: "",
      telegram: "",
      x: "",
      image: undefined,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      toast.error("Please connect your wallet first using the button in the header");
      return;
    }

    // Only validate and process form data if wallet is connected
    await form.handleSubmit(onSubmit)(e);
  };

  const onSubmit = async (data: FormData) => {
    // Instead of launching, show the pre-buy card
    setPendingFormData(data);
    setShowPreBuyCard(true);
  };

  const handleFinalLaunch = async () => {
    if (!pendingFormData) return;
    setShowPreBuyCard(false);
    // Here, trigger upload to IPFS and on-chain tx
    // You can access the buy amount in preBuyAmount (string)
    await actualLaunchFunction(pendingFormData, preBuyAmount);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(fakeEvent);
        // Also update react-hook-form
        form.setValue("image", file, { shouldValidate: true });
      }
    },
    [handleFileChange, form]
  );

  // Move the original launch logic here
  const actualLaunchFunction = async (data: FormData, preBuyAmount: string) => {
    try {
      setIsLoading(true);
      // Get the file from the file input
      const file = fileInputRef.current?.files?.[0];
      if (!file || !sendTransaction || !publicKey) {
        toast.error(file ? 'Wallet not connected' : 'Token logo is required');
        return;
      }

      // Convert logo to base64
      const base64File = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const keyPair = Keypair.generate();

      // Step 1: Upload to R2 and get transaction
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenLogo: base64File,
          mint: keyPair.publicKey.toBase58(),
          tokenName: data.name,
          tokenSymbol: data.ticker,
          userWallet: publicKey.toBase58(),
          website: data.website,
          telegram: data.telegram,
          twitter: data.x,
          preBuyAmount: preBuyAmount || undefined,
        }),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error);
      }

      const uploadJson = await uploadResponse.json();
      const metadataUrl = uploadJson.metadataUrl;

      const connection = new Connection(
        process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
      );

      const client = new DynamicBondingCurveClient(connection, 'confirmed');
      const { createPoolTx, swapBuyTx } = await client.pool.createPoolWithFirstBuy({
        createPoolParam: {
          config: new PublicKey(process.env.NEXT_PUBLIC_POOL_CONFIG_KEY as string),
          baseMint: keyPair.publicKey,
          name: data.name || "",
          symbol: data.ticker || "",
          uri: metadataUrl,
          payer: publicKey,
          poolCreator: publicKey,
        },
        firstBuyParam: {
          buyer: publicKey,
          buyAmount: new BN(parseFloat(preBuyAmount) * 1e9),
          minimumAmountOut: new BN(0),
          referralTokenAccount: null,
        }
      });

      const combinedTx = new Transaction();
      createPoolTx.instructions.forEach(ix => combinedTx.add(ix));
      if (swapBuyTx) {
        swapBuyTx.instructions.forEach(ix => combinedTx.add(ix));
      }

      const {
        value: { blockhash, lastValidBlockHeight }
      } = await connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(combinedTx, connection, { signers: [keyPair] });
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

      toast.success('Token created successfully');
      setPoolCreated(true);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'WalletSignTransactionError' ||
          error.message?.toLowerCase().includes('user rejected'))
      ) {
        toast('Transaction was cancelled.');
      } else {
        console.error("Error creating token:", error);
        toast.error(error instanceof Error ? error.message : 'Failed to create token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (poolCreated) {
    return (
      <div className="flex-grow flex justify-center items-center px-4 py-8">
        <div className="w-full max-w-lg bg-card rounded-xl shadow-lg p-8 border border-border text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Token Created Successfully!</h2>
          <p className="mb-4">Your token has been created and is now ready to use.</p>
          <Button onClick={() => setPoolCreated(false)} className="bg-blue-500 text-white hover:bg-blue-600">
            Create Another Token
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full flex justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-card rounded-xl shadow-lg p-8 border border-border my-auto">
          <h2 className="text-2xl font-bold mb-2 text-left">Create Token</h2>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-3 text-sm text-muted-foreground font-medium text-left">
                Choose wisely, you won't be able to change any data once the token is created.
              </div>
              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name your token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="ticker" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker</FormLabel>
                  <FormControl>
                    <Input placeholder="Add your token a ticker (e.g. BTC)" maxLength={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your token (max 500 chars)" maxLength={500} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="social-links">
                  <AccordionTrigger className="text-sm font-medium leading-none flex items-center gap-2 justify-start text-left">
                    <Globe className="w-4 h-4 text-foreground" />
                    <span>Social links</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <FormField name="website" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourproject.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="telegram" control={form.control} render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Telegram <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="https://t.me/yourchannel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField name="x" control={form.control} render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>X.com <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="https://x.com/yourhandle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <FormField name="image" control={form.control} render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium leading-none">Image</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file && file.size > 2 * 1024 * 1024) {
                            form.setError("image", { type: "manual", message: "Image must be less than 2MB" });
                            return;
                          } else {
                            form.clearErrors("image");
                          }
                          handleFileChange(e);
                          onChange(file || null);
                        }}
                      />
                      {!previewUrl ? (
                        <div
                          onClick={handleThumbnailClick}
                          onDragOver={handleDragOver}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted",
                            isDragging && "border-primary/50 bg-primary/5"
                          )}
                        >
                          <div className="rounded-full bg-background p-3 shadow-sm">
                            <ImagePlus className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Click to select</p>
                            <p className="text-xs text-muted-foreground">or drag and drop</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Image
                            src={previewUrl}
                            alt="Token preview"
                            width={400}
                            height={256}
                            className="h-64 w-full rounded-lg object-contain bg-muted/30"
                            unoptimized={true}
                          />
                          <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {/* Image requirements info */}
                      <div className="mt-3 flex flex-col gap-2 items-start text-xs text-muted-foreground bg-muted/60 rounded-lg p-3 border border-muted-foreground/10">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-foreground" />
                          <span>Size - max 2mb. ".jpg", ".gif" or ".png" recommended</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ImagePlus className="w-4 h-4 text-foreground" />
                          <span>Resolution - min. 100x100px, 1:1 square recommended</span>
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {connected ? (
                <RainbowButton
                  type="submit"
                  disabled={isLoading}
                  teal
                  className={cn(
                    "w-full text-sm rounded-md h-10 font-medium"
                  )}
                >
                  {isLoading ? "Launching..." : "Launch"}
                </RainbowButton>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full text-sm rounded-md h-10",
                    isLoading && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isLoading ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </form>
          </Form>
        </div>
      </div>

      <Dialog open={showPreBuyCard} onOpenChange={setShowPreBuyCard}>
        <DialogContent className="max-w-lg p-8">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-2xl font-bold">Buy your token <span className="text-sm text-muted-foreground font-normal">(optional)</span></DialogTitle>
            <DialogDescription>
              Choose how many {pendingFormData?.name || "tokens"} you want to buy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <InputWithAdornment
                id="pre-buy-amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={preBuyAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreBuyAmount(e.target.value)}
                adornment="SOL"
                adornmentPosition="right"
              />
              {(() => {
                const solAmount = parseFloat(preBuyAmount) || 0;
                const amount = 0.9 * (solAmount * 1097600432) / (solAmount + 32.928);
                const formattedAmount = Math.round(amount).toLocaleString();
                const percent = ((amount / 1_000_000_000) * 100).toFixed(2);

                return (
                  <p className="text-xs text-muted-foreground">
                    You buy {formattedAmount} {pendingFormData?.ticker || "TOKEN"} ({percent}% of total supply)
                  </p>
                );
              })()}
            </div>
            <RainbowButton
              teal
              className="w-full text-sm rounded-md h-10 font-medium"
              onClick={handleFinalLaunch}
              disabled={isLoading}
            >
              {isLoading ? "Launching..." : "Launch"}
            </RainbowButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateTokenPageContent; 