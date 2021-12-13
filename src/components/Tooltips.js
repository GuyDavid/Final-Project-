import { Tooltip } from "@material-ui/core";
import { withStyles } from "@material-ui/styles";
import Colours from "../constants/Colours";
export const ButtonToolTip = withStyles(theme => ({
    tooltip: {
        fontSize: 14,
        fontWeight: "bold",
        backgroundColor: Colours.black
    },
    arrow: {
        color: Colours.black
    }
}))(Tooltip);