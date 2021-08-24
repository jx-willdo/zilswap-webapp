import { Box, makeStyles } from "@material-ui/core";
import { AppTheme } from "app/theme/types";
import React from "react";

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {},
}));

const TheBearMarket: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props: any) => {
    const { children, className } = props;
    const classes = useStyles();

    return (
        <Box>
            <h1>Hello World!</h1>
        </Box>
    );
};

export default TheBearMarket;
