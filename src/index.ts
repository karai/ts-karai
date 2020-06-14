/////////////////////////////////////////////
//
// Copyright 2020, The TurtleCoin Developers
//
/////////////////////////////////////////////

import ax from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { Address } from 'turtlecoin-utils';
import WebSocket from 'ws';
import { loadEnv } from './utils/loadEnv';

// load the environment variables
loadEnv();

export const { POINTER_WS, POINTER_HTTP } = process.env;

async function checkOnline() {
  const endpoint = '/api/v1/version';
  return ax.get(`${POINTER_HTTP}${endpoint}`);
}

async function checkPeerID() {
  const endpoint = '/api/v1/peer';
  return ax.get(`${POINTER_HTTP}${endpoint}`);
}

async function checkTransactions() {
  const endpoint = '/api/v1/transactions';
  return ax.get(`${POINTER_HTTP}${endpoint}`);
}

async function initWebsocket() {
  const endpoint = '/api/v1/join';
  const spinner = ora({
    color: 'cyan',
    text: `Attempting connection to pointer at ${POINTER_WS!}${endpoint}`,
  }).start();

  const address = Address.fromEntropy('123');

  const ws = new WebSocket(`${POINTER_WS!}${endpoint}`);

  ws.on('open', async () => {
    spinner.succeed();
    console.log(chalk.green(`Connection success.`));
    console.log(chalk.bold('OUT:'), `JOIN ${address.view.publicKey}`);
    ws.send(`JOIN ${address.view.publicKey}`);
  });

  ws.on('close', () => {
    spinner.fail();
    console.log(chalk.yellow('Websocket connection closed.'));
  });

  ws.on('message', (data: any) => {
    console.log(chalk.bold('COORDINATOR:'), data);
  });

  ws.on('error', (err) => {
    spinner.fail();
    console.log(chalk.red.bold(err));
  });

  return ws;
}

async function main() {
  const versionRes = await checkOnline();
  if (versionRes.data && versionRes.data.karai_version) {
    console.log(
      chalk.green.bold(`Coordinator ONLINE\n${versionRes.data.karai_version}`)
    );

    const peerRes = await checkPeerID();
    if (peerRes.data && peerRes.data.p2p_peer_ID) {
      console.log(
        chalk.green.bold(`Coordinator P2P Peer ID: ${peerRes.data.p2p_peer_ID}`)
      );
    }

    const txRes = await checkTransactions();
    // console.log(txRes.data);
  }

  const ws = await initWebsocket();
}

main();
