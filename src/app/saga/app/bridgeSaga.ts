import { actions } from "app/store";
import { BridgeTx, RootState } from "app/store/types";
import { logger } from "core/utilities";
import { call, fork, race, select, take } from "redux-saga/effects";
import { TradeHubSDK, ConnectedTradeHubSDK } from "tradehub-api-js";

export enum Status {
  NotStarted,
  // DepositApproved,
  DepositTxStarted,
  DepositTxConfirmed,
  WithdrawTxStarted,
  WithdrawTxConfirmed,
}

function getBridgeTxStatus(tx: BridgeTx): Status {
  if (tx.destinationTxConfirmedAt) {
    return Status.WithdrawTxConfirmed;
  }

  if (tx.withdrawTxHash) {
    return Status.WithdrawTxStarted;
  }

  if (tx.depositTxHash) {
    return Status.DepositTxConfirmed;
  }

  if (tx.sourceTxHash) {
    return Status.DepositTxStarted;
  }

  return Status.NotStarted;
}

function* watchDepositConfirmation() {
  while (true) {
    try {
      const bridgeTxs = (yield select((state: RootState) => state.bridge.bridgeTxs)) as BridgeTx[];
      const relevantTxs = bridgeTxs.filter(tx => getBridgeTxStatus(tx) === Status.DepositTxStarted);

      for (const tx of relevantTxs) {
        try {
          // // watch and update relevant txs

          // tx.depositTxHash = extTransfer.external_hash

          // // trigger withdraw tx if deposit confirmed

          const sdk = new TradeHubSDK({
            network: TradeHubSDK.Network.DevNet,
          });
          const connectedSDK = (yield call([sdk, sdk.connectWithMnemonic], tx.interimAddrMnemonics)) as ConnectedTradeHubSDK

          // const withdrawTx = connectedSDK.coin.withdraw({
          //   ...
          // })

          // tx.withdrawTxHash = withdrawTx.hash // ready for next saga to proceed

        } catch (error) {
          console.error('process deposit tx error');
          console.error(error);
        }
      }
    } catch (error) {
      console.error("watchDepositConfirmation error")
      console.error(error)
    } finally {
      yield race({
        bridgeTxUpdated: take(actions.Bridge.addBridgeTx),
      });
    }
  }
}
function* watchWithdrawConfirmation() {
  while (true) {
    try {
      const bridgeTxs = (yield select((state: RootState) => state.bridge.bridgeTxs)) as BridgeTx[];
      const relevantTxs = bridgeTxs.filter(tx => getBridgeTxStatus(tx) === Status.WithdrawTxStarted);

      for (const tx of relevantTxs) {
        try {
          // // watch and update relevant txs

          // tx.destinationTxHash = dstChainTx.hash
          // tx.destinationTxConfirmedAt = dstChainTx.blocktime

        } catch (error) {
          console.error('process withdraw tx error');
          console.error(error);
        }
      }
    } catch (error) {
      console.error("watchDepositConfirmation error")
      console.error(error)
    } finally {
      yield race({
        bridgeTxUpdated: take(actions.Bridge.addBridgeTx),
      });
    }
  }
}

export default function* bridgeSaga() {
  logger("init bridge saga");
  yield fork(watchDepositConfirmation);
  yield fork(watchWithdrawConfirmation);
}
