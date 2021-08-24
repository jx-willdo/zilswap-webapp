import { Box, LinearProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { AppTheme } from "app/theme/types";
import React, { Suspense } from "react";
import { renderRoutes } from "react-router-config";

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white"
  },
  content: {
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down("sm")]: {
      display: "block",
    }
  },
}));

const TBMLayout: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props: any) => {
  const { route } = props;
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <main className={classes.content}>
        <Suspense fallback={<LinearProgress />}>
          {renderRoutes(route.routes)}
        </Suspense>
      </main>
    </Box>
  );
};

export default TBMLayout;
