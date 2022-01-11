import {FC, forwardRef, ReactElement, Ref, useEffect} from "react";
import {TransitionProps} from "@mui/material/transitions";
import {AppBar, Dialog, Drawer, IconButton, Slide, Toolbar} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {useRouter} from "next/router";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DetailsDialog: FC<{
  open: boolean,
  handleClose: () => void
}> = ({open, handleClose, children}) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      handleClose();
    }

    router.events.on('routeChangeStart', handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [])

  return (
    <Drawer
      // fullScreen
      anchor="right"
      open={open}
      onClose={handleClose}
      // TransitionComponent={Transition}
      PaperProps={{
        sx: {
          width: "50%"
        }
      }}
    >
      <AppBar sx={{position: 'relative'}}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon/>
          </IconButton>
        </Toolbar>
      </AppBar>
      {children}
    </Drawer>);
}

export default DetailsDialog;
