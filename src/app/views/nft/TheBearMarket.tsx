import { AppBar, Box, Button, CircularProgress, Grid, InputAdornment, makeStyles, OutlinedInput, Toolbar } from "@material-ui/core";
import CallMissedOutgoingIcon from '@material-ui/icons/CallMissedOutgoingRounded';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { bytes } from "@zilliqa-js/zilliqa";
import { Text } from 'app/components';
import { actions } from "app/store";
import { RootState } from "app/store/types";
import { AppTheme } from "app/theme/types";
import { truncate, useAsyncTask, useNetwork, useTaskSubscriber } from "app/utils";
import { LoadingKeys } from "app/utils/constants";
import { logger } from "core/utilities";
import { ConnectedWallet, ConnectWalletResult, connectWalletZilPay } from "core/wallet";
import { BN, ZilswapConnector } from 'core/zilswap';
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ObservedTx } from "zilswap-sdk";
import { Network } from "zilswap-sdk/lib/constants";
import AddIcon from '@material-ui/icons/AddRounded';
import RemoveIcon from '@material-ui/icons/RemoveRounded';
import cls from "classnames";

const useStyles = makeStyles((theme: AppTheme) => ({
    root: {
        flex: 1,
        "& .MuiTypography-root": {
            fontFamily: '"Baloo Paaji 2", cursive',
        },
        "& .MuiOutlinedInput-input": {
            fontFamily: '"Baloo Paaji 2", cursive',
        },
        "& .MuiButton-root": {
            fontFamily: '"Baloo Paaji 2", cursive',
        },
        "& .MuiToolbar-regular": {
            minHeight: "100px",
            [theme.breakpoints.up('sm')]: {
                minHeight: "120px"
            }
        },
        "& .MuiToolbar-gutters": {
            [theme.breakpoints.up('sm')]: {
                paddingLeft: "48px",
                paddingRight: "48px"
            }
        }
    },
    actionButton: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
        height: 48,
        width: 200
    },
    inputBox: {
        marginTop: theme.spacing(1),
        border: "5px solid #FB6447",
        borderRadius: "20px",
        height: 80,
        width: 300,
        color: "#FB6447",
        backgroundColor: "#FFFFFF",
        "& input": {
            padding: "17.5px 14px",
            fontSize: "40px",
            height: "0.5rem"
        },
        '&.Mui-focused': {
            caretColor: "#FB6447",
        },
    },
    brand: {
        fontSize: "32px",
        color: "#511500"
    },
    toolbar: {
        "& .MuiToolbar-gutters": {
            [theme.breakpoints.up('xs')]: {
                paddingLeft: "32px",
                paddingRight: "32px"
            }
        }
    },
    navButton: {
        padding: "4px 20px",
        backgroundColor: "#511500",
        minHeight: 44,
        minWidth: 140,
        "& .MuiTypography-root": {
            fontSize: "20px",
            color: '#FFFFFF',
        },
        "&:hover": {
            backgroundColor: "#511500"
        },
        [theme.breakpoints.down('xs')]: {
            display: "none"
        }
    },
    mintButton: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(4),
        height: 80,
        width: 300,
        borderRadius: "20px",
        backgroundColor: "#FB6447",
        "& .MuiTypography-root": {
            fontSize: "40px",
            color: '#FFFFFF',
        },
        "&:hover": {
            backgroundColor: "#FB6447"
        },
    },
    progress: {
        color: "#FFFFFF",
    },
    dotIcon: {
        color: "#ADFF00",
        fontSize: "0.9rem",
        verticalAlign: "middle",
        marginRight: theme.spacing(0.8)
    },
    heroSection: {
        background: "#FCCC14",
        minHeight: "100vh",
        borderBottom: "10px solid #FF5252"
    },
    heroContainer: {
        [theme.breakpoints.down('xs')]: {
            flexDirection: "column-reverse"
        }
    },
    heroText: {
        color: "#511500",
        fontSize: "36px",
        lineHeight: "42px"
    },
    bearMarketText: {
        fontSize: "48px",
        lineHeight: "56px"
    },
    aboutSection: {
        background: "#84C9FD",
        minHeight: "100vh",
    },
    faqSection: {
        background: "#00132F",
        minHeight: "100vh",
    },
    footer: {
        background: "#FB6447",
        "& .MuiTypography-root": {
            color: '#511500',
            lineHeight: "32px"
        },
    },
    callMissedOutgoingIcon: {
        color: "#D39367",
        verticalAlign: "middle"
    },
    toggleQtyButton: {
        backgroundColor: "#FB6447",
        borderRadius: "0px",
        padding: "4px 24px 4px 16px",
        "&:hover": {
            backgroundColor: "#FB6447"
        },
        height: 38
    },
    addButton: {
        borderTopRightRadius: "20px"
    },
    subtractButton: {
        borderBottomRightRadius: "20px",
    },
    toggleQtyIcon: {
        color: "#FFFFFF",
        fontSize: "32px!important"
    },
}));

const CONTRACT_ADDR = "0xb9f08643a228a226ffbce6f2297f5c5ced612491";

const CHAIN_ID = {
    [Network.TestNet]: 333, // chainId of the developer testnet
    [Network.MainNet]: 1, // chainId of the mainnet
}

const msgVersion = 1; // current msgVersion

const TheBearMarket: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props: any) => {
    const classes = useStyles();
    const wallet = useSelector<RootState, ConnectedWallet | null>(state => state.wallet.wallet);
    const [mintQty, setMintQty] = useState<number>(1);
    const [runMint, isMinting, error] = useAsyncTask("mint");
    const [runConnectTask, errorConnect] = useAsyncTask<void>("connectWalletZilPay");
    const [isLoading] = useTaskSubscriber(...LoadingKeys.connectWallet);
    const network = useNetwork();
    const dispatch = useDispatch();

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const qty = event.target.valueAsNumber;
        setMintQty(qty);
    }

    const onInputBlur = () => {
        if (isNaN(mintQty) || mintQty === 0) {
            setMintQty(1);
        }
    }

    const handleMint = () => {
        if (!wallet) {
            connectZilPay();
            return;
        }

        runMint(async () => {
            if (mintQty === 1) {
                await mint();
            } else {
                await batchMint();
            }
        });
    }

    // TODO: clean up functions
    const mint = async () => {
        const zilswap = ZilswapConnector.getSDK();

        if (!zilswap.zilliqa) throw new Error("Wallet not connected");
      
        const chainId = CHAIN_ID[network];
        const minterContract = zilswap.getContract(CONTRACT_ADDR);
      
        const address = wallet!.addressInfo.byte20;

        const args = [{
            vname: "to",
            type: "ByStr20",
            value: `${address}`,
        }];
      
        const minGasPrice = (await zilswap.zilliqa.blockchain.getMinimumGasPrice()).result as string;
        const params: any = {
            amount: new BN(1),
            gasPrice: new BN(minGasPrice),
            gasLimit: "5000",
            version: bytes.pack(chainId, msgVersion),
        };
      
        const claimTx = await zilswap.callContract(minterContract, "Mint", args, params, true);
        logger("claim tx dispatched", claimTx.id);
      
        if (claimTx.isRejected()) {
            throw new Error('Submitted transaction was rejected.')
        }
      
        const observeTxn: ObservedTx = {
            hash: claimTx.id!,
            deadline: Number.MAX_SAFE_INTEGER,
        };
      
        await zilswap.observeTx(observeTxn)
        console.log("mint observe tx: ", observeTxn);
      
        return observeTxn;
    }

    const batchMint = async () => {
        const zilswap = ZilswapConnector.getSDK();

        if (!zilswap.zilliqa) throw new Error("Wallet not connected");
      
        const chainId = CHAIN_ID[network];
        const minterContract = zilswap.getContract(CONTRACT_ADDR);
      
        const address = wallet!.addressInfo.byte20;

        const args = [
            {
                vname: "to",
                type: "ByStr20",
                value: address,
            },
            {
                vname: "size",
                type: "Uint32",
                value: `${mintQty}`,
            }
        ];
      
        const minGasPrice = (await zilswap.zilliqa.blockchain.getMinimumGasPrice()).result as string;
        const params: any = {
            amount: new BN(mintQty),
            gasPrice: new BN(minGasPrice),
            gasLimit: "5000",
            version: bytes.pack(chainId, msgVersion),
        };
      
        const claimTx = await zilswap.callContract(minterContract, "BatchMint", args, params, true);
        logger("claim tx dispatched", claimTx.id);
      
        if (claimTx.isRejected()) {
            throw new Error('Submitted transaction was rejected.')
        }
      
        const observeTxn: ObservedTx = {
            hash: claimTx.id!,
            deadline: Number.MAX_SAFE_INTEGER,
        };
      
        await zilswap.observeTx(observeTxn);
        console.log("batch mint observe tx: ", observeTxn);
      
        return observeTxn;
    }

    const connectZilPay = () => {
        runConnectTask(async () => {
            if (!!wallet) return;

            const zilPay = (window as any).zilPay;
            if (typeof zilPay === "undefined")
            throw new Error("ZilPay extension not installed");
    
            const result = await zilPay.wallet.connect();
            if (result !== zilPay.wallet.isConnect)
            throw new Error("ZilPay could not be connected to.");
    
            const walletResult: ConnectWalletResult = await connectWalletZilPay(zilPay);
            if (walletResult.error)
            throw walletResult.error;
    
            if (walletResult.wallet) {
                const { wallet } = walletResult;
                const { network } = wallet;
                dispatch(actions.Blockchain.initialize({ network, wallet }));
                return;
            }
        });
    }

    const navButtonContent = !!wallet 
        ? <span>
            <FiberManualRecordIcon className={classes.dotIcon}/>
            {truncate(wallet!.addressInfo.bech32, 6, 4)}
        </span>
        : "CONNECT";

    const mintButtonContent = !wallet
        ? "CONNECT"
        : isMinting
            ? "MINTING..."
            : "MINT";

    const handleAddQty = () => {
        setMintQty(mintQty + 1);
    }

    const handleSubtractQty = () => {
        if (mintQty === 1) return;

        setMintQty(mintQty - 1);
    }

    return (
        <Box display="flex" flexDirection="column" className={classes.root}>
            {/* Hero section */}
            <section id="hero" className={classes.heroSection}>
                {/* Navbar with connect wallet button */}
                <AppBar color="transparent" elevation={0} position="static">
                    <Toolbar className={classes.toolbar}>
                        <Grid container justify="space-between">
                            {/* Nav links */}
                            <Grid>
                                <Text variant="h1" margin={1} className={classes.brand}>TheBearMarket</Text>
                            </Grid>

                            {/* Connect Wallet Button */}
                            <Grid>
                                <Button className={classes.navButton} onClick={connectZilPay} disableFocusRipple>
                                    {isLoading 
                                        ? <CircularProgress size={18} className={classes.progress} />
                                        : <Text variant="h3" margin={1}>
                                            {navButtonContent}
                                        </Text>
                                    }
                                </Button>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>

                <Box display="flex" justifyContent="center" className={classes.heroContainer}>
                    {/* Bear goes here */}
                    <Box>
                        <Text>
                            I am a bear
                        </Text>
                    </Box>

                    <Box display="flex" flexDirection="column" ml={2}>
                        <Text variant="h1" className={classes.heroText}>
                            The ONLY bears <br />
                            you'll need to <br />
                            get through this <br />
                            <span className={classes.bearMarketText}>
                                BEAR MARKET
                                <CallMissedOutgoingIcon fontSize="inherit" className={classes.callMissedOutgoingIcon} />
                            </span>
                        </Text>
                                    
                        <Box mt={2.5} display="flex" flexDirection="column">
                            <Text variant="h1" className={classes.heroText}>Mint your bear:</Text>

                            <OutlinedInput
                                className={classes.inputBox}
                                placeholder={"1"}
                                onChange={onInputChange}
                                onBlur={onInputBlur}
                                value={mintQty.toString()}
                                type="number"
                                inputProps={{ min: "1", style: { textAlign: 'center' }}}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <Box display="flex" flexDirection="column" justifyContent="space-between" style={{ height: 80 }}>
                                            <Button onClick={handleAddQty} className={cls(classes.toggleQtyButton, classes.addButton)} endIcon={<AddIcon className={classes.toggleQtyIcon} />} disableRipple/>
                                            <Button onClick={handleSubtractQty} className={cls(classes.toggleQtyButton, classes.subtractButton)} endIcon={<RemoveIcon className={classes.toggleQtyIcon} />} disableRipple/>
                                        </Box>
                                    </InputAdornment>
                                    } 
                                />
                        </Box>

                        <Button className={classes.mintButton} onClick={handleMint} disableFocusRipple>
                            {isLoading
                                ? <CircularProgress size={30} className={classes.progress} />
                                : <Text variant="h1">
                                    {mintButtonContent}
                                </Text>
                            }
                        </Button>
                    </Box>
                </Box>
            </section>

            {/* About section */}
            <section id="about" className={classes.aboutSection}>

            </section>

            {/* FAQ section */}
            <section id="faq" className={classes.faqSection}>

            </section>

            {/* Footer */}
            <footer className={classes.footer}>
                <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                    <Text variant="h1">(Placeholder)</Text>
                    <Text variant="h1">TheBearMarket</Text>
                    <Text variant="h1">All Rights Reserved 2021</Text>
                    <Text variant="h1" marginTop={1}>Terms of Use</Text>
                </Box>
            </footer>
        </Box>
    );
};

export default TheBearMarket;
