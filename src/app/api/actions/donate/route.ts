import {
  ActionGetResponse,
  ActionPostResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Keypair,
  ParsedAccountData,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const DESTINATION_WALLET = "4MSJUhmxaLmJivBpGcy3txwRXhFsAhogfVFWkapYdfuj";
const MINT_ADDRESS = "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa";
const TRANSFER_AMOUNT = 10;

export async function GET(request: Request) {
  const response: ActionGetResponse = {
    icon: "https://koffeee-blink.vercel.app/2.png",
    description: "Buy me a CHAI With send",
    title: "Buy me a चाय",
    label: "Donate",
    links: {
      actions: [
        {
          href: "/api/actions/donate?amount=10",
          label: "  10 Send  ",
        },
        {
          href: "/api/actions/donate?amount=100",
          label: "  100 Send  ",
        },
        {
          href: "/api/actions/donate?amount=1000",
          label: "  1000 Send  ",
        },
        {
          href: "/api/actions/donate?amount={amount}",
          label: "Send",
          parameters: [
            {
              name: "amount",
              required: true,
              label: "Enter the amount",
            },
          ],
        },
      ],
    },
  };
  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = GET;

export const POST = async (request: Request) => {
  try {
    const url = new URL(request.url);
    const body: ActionPostRequest = await request.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      throw "Invalid account";
    }

    let amount: number = 10;

    if (url.searchParams.has("amount")) {
      try {
        amount = parseFloat(url.searchParams.get("amount") || "10");
        console.log(amount);
      } catch (error) {
        throw "Invalid amount";
      }
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    let senderata = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      account,
      false
    );
    let reciverata = await getAssociatedTokenAddress(
      new PublicKey(MINT_ADDRESS),
      new PublicKey(DESTINATION_WALLET),
      false
    );

    let senderataacc = connection.getAccountInfo(senderata);
    let reciverataacc = connection.getAccountInfo(reciverata);

    const transaction = new Transaction();

    if (!senderataacc) {
        console.log("Creating senderata");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          account,
          reciverata,
          new PublicKey(account),
          new PublicKey(MINT_ADDRESS)
        ),
        createTransferInstruction(
          senderata,
          reciverata,
          account,
          amount * Math.pow(10, 6)
        )
      );
    } else {
      transaction.add(
        createTransferInstruction(
          senderata,
          reciverata,
          account,
          amount * Math.pow(10, 6)
        )
      );
    }

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    
    transaction.feePayer = account;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Hello thanks for the donation",
      },
    });
    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    let message = "an unknown error";
    if (typeof error == "string") {
      message = error;
    }
    return Response.json({ message }, { headers: ACTIONS_CORS_HEADERS });
  }
};
