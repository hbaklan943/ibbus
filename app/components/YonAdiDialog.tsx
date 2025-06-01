import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import { StopDetail } from "../api/proxyStopDetail/route";

export interface YonAdiDialogProps {
    open: boolean;
    selectedValue: string;
    onClose: (index: number, selectedValue: string) => void;
    index: number; // Added index prop to identify which selection is being edited
    stopList: StopDetail[];
}

export default function YonAdiDialog(props: YonAdiDialogProps) {
    const { onClose, selectedValue, open, index, stopList } = props;

    const handleClose = () => {
        onClose(index, selectedValue);
    };

    const handleListItemClick = (index: number, value: string) => {
        onClose(index, value);
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                    bgcolor: "black",
                    color: "primary.contrastText",
                }}
            >
                Yön Seç
            </DialogTitle>
            <List sx={{ pt: 0 }}>
                {[
                    ...new Set(
                        (stopList || []).map((stop) => stop.YON_ADI),
                    ),
                ]
                    .map((
                        yon,
                    ) => (
                        <ListItem disablePadding key={yon}>
                            <ListItemButton
                                selected={selectedValue === yon}
                                onClick={() => handleListItemClick(index, yon)}
                                sx={{
                                    "&.Mui-selected": {
                                        backgroundColor: "gray",
                                        color: "primary.contrastText",
                                    },
                                    "&:hover": {
                                        backgroundColor: "primary.light",
                                    },
                                }}
                            >
                                <ListItemText primary={yon} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => handleListItemClick(index, "")}
                        sx={{
                            "&:hover": {
                                backgroundColor: "primary.light",
                            },
                            "&.Mui-selected": {
                                backgroundColor: "gray",
                                color: "primary.contrastText",
                            },
                        }}
                        selected={selectedValue === ""}
                    >
                        <ListItemText primary="Hepsini Göster" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Dialog>
    );
}
