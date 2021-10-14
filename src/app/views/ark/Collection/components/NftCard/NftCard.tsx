import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CardProps,
  IconButton,
  makeStyles,
  SvgIcon,
  Typography,
} from "@material-ui/core";
import UnlikedIcon from "@material-ui/icons/FavoriteBorderRounded";
import LikedIcon from "@material-ui/icons/FavoriteRounded";
import DotIcon from "@material-ui/icons/FiberManualRecordRounded";
import { AppTheme } from "app/theme/types";
import cls from "classnames";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ReactComponent as VerifiedBadge } from "../../verified-badge.svg";
import { Nft } from "app/store/marketplace/types";
import { toBech32Address } from "core/zilswap";
import { useAsyncTask } from "app/utils";
import { ArkClient } from "core/utilities";
import { useDispatch, useSelector } from "react-redux";
import { RootState, MarketPlaceState, OAuth, WalletState } from "app/store/types";
import dayjs from "dayjs";
import { actions } from "app/store";

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {
    width: "100%",
    maxWidth: "308px",
    borderRadius: 10,
    boxShadow: "none",
    backgroundColor: "transparent",
    position: "relative",
  },
  borderBox: {
    border: `1px solid ${theme.palette.type === "dark" ? "#29475A" : "rgba(0, 51, 64, 0.5)"
      }`,
    borderRadius: 10,
    // border: "1px solid transparent",
    // backgroundImage:
    //   theme.palette.type === "dark"
    //     ? "linear-gradient(transparent, transparent), linear-gradient(#29475A, #29475A)"
    //     : "linear-gradient(transparent, transparent), linear-gradient(to right, green, gold)",
    // backgroundOrigin: "border-box",
    // backgroundClip: "content-box, border-box",
  },
  image: {
    borderRadius: "0px 0px 10px 10px!important",
  },
  tokenId: {
    color: "#511500",
    fontSize: "40px",
    lineHeight: "50px",
    [theme.breakpoints.down("md")]: {
      fontSize: "30px",
      lineHeight: "40px",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: theme.spacing(1, 1.5),
  },
  bid: {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 900,
    fontSize: "13px",
    lineHeight: "16px",
    color: theme.palette.text?.primary,
  },
  dotIcon: {
    fontSize: "inherit",
    color: "#FF5252",
    verticalAlign: "middle",
    paddingBottom: "1.5px",
    marginLeft: "-2px",
    marginRight: "2px",
  },
  lastOffer: {
    color: theme.palette.primary.light,
    fontSize: "12px",
    lineHeight: "14px",
  },
  likes: {
    color: theme.palette.label,
    fontSize: "12px",
    lineHeight: "14px",
    marginRight: "4px",
  },
  likeIconButton: {
    padding: 0,
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  likeButton: {
    color: theme.palette.primary.light,
  },
  cardContent: {
    marginLeft: "-16px",
    marginRight: "-16px",
    paddingBottom: 0,
  },
  title: {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 900,
    fontSize: "14px",
    lineHeight: "16px",
    color: theme.palette.text?.primary,
    textTransform: "uppercase",
  },
  bodyBox: {
    padding: theme.spacing(0, 1.5),
  },
  body: {
    fontSize: "12px",
    fontWeight: 700,
    color: theme.palette.primary.light,
  },
  verifiedBadge: {
    marginLeft: "4px",
    width: "15px",
    height: "15px",
    verticalAlign: "text-top",
  },
  rarityBackground: {
    backgroundColor: "rgba(107, 225, 255, 0.2)",
    borderRadius: 5,
    display: "flex",
    marginTop: theme.spacing(1),
    padding: "3px",
  },
  rarityBar: {
    display: "flex",
    backgroundColor: "#6BE1FF",
    borderRadius: 5,
    padding: "1.5px",
    width: "100%",
  },
}));

export interface Props extends CardProps {
  token: Nft;
  collectionAddress: string;
}

const NftCard: React.FC<Props> = (props: Props) => {
  const { className, token, collectionAddress, ...rest } = props;
  const classes = useStyles();
  const [liked, setLiked] = useState<boolean>(false);
  const [runLikeToken] = useAsyncTask("likeToken");
  const { oAuth } = useSelector<RootState, MarketPlaceState>((state) => state.marketplace);
  const { wallet } = useSelector<RootState, WalletState>((state) => state.wallet);
  const dispatch = useDispatch()

  useEffect(() => {
    if (token) {
      setLiked(!!token.isFavourited);
    }
  }, [token])

  const likeToken = () => {
    runLikeToken(async () => {
      if (!wallet) return;
      let newOAuth: OAuth | undefined = oAuth;
      const arkClient = new ArkClient(wallet!.network)
      if (!newOAuth?.access_token || (newOAuth?.expires_at && dayjs(newOAuth.expires_at * 1000).isBefore(dayjs()))) {
        const { result } = await arkClient.arkLogin(wallet!, window.location.hostname);
        dispatch(actions.MarketPlace.updateAccessToken(result));
        newOAuth = result;
      }
      if (!liked) {
        await arkClient.postFavourite(collectionAddress, token.tokenId, newOAuth!.access_token);
      } else {
        await arkClient.removeFavourite(collectionAddress, token.tokenId, newOAuth!.access_token);
      }
      setLiked(!liked);
    })
  }

  return (
    <Card {...rest} className={cls(classes.root, className)}>
      <Box className={classes.borderBox}>
        <Box className={classes.cardHeader}>
          {/* to accept as props */}
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Typography className={classes.bid}>
              <DotIcon className={classes.dotIcon} /> BID LIVE 10:00:26 Left
            </Typography>
            <Typography className={classes.lastOffer}>
              Last Offer 200,000 ZIL
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Typography className={classes.likes}>100K</Typography>
            <IconButton
              onClick={() => likeToken()}
              className={classes.likeIconButton}
              disableRipple
            >
              <SvgIcon
                component={liked ? LikedIcon : UnlikedIcon}
                className={classes.likeButton}
              />
            </IconButton>
          </Box>
        </Box>
        <CardActionArea
          component={Link}
          to={`/ark/collections/${toBech32Address(collectionAddress)}/${token.tokenId}`}
        >
          <CardMedia
            className={classes.image}
            component="img"
            alt="NFT image"
            height="308"
            image={token.asset?.url}
          />
        </CardActionArea>
      </Box>
      <CardContent className={classes.cardContent}>
        <Box className={classes.bodyBox}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            {/* to truncate if too long? */}
            <Typography className={classes.title}>
              {token.name}
              <VerifiedBadge className={classes.verifiedBadge} />
            </Typography>
            <Typography className={classes.title}>1M ZIL</Typography>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mt={0.5}
          >
            <Typography className={classes.body}>#{token.tokenId}</Typography>
            <Typography className={classes.body}>~$100,000</Typography>
          </Box>
        </Box>

        {/* TODO: refactor and take in a rarity as prop */}
        {/* Rarity indicator */}
        <Box className={classes.rarityBackground}>
          <Box className={classes.rarityBar} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default NftCard;
