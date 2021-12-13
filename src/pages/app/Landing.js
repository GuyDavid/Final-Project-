import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Computer, ExitToApp, ForumOutlined, GroupAdd, Home, InfoOutlined, Person, Security, UnfoldLess, UnfoldMore } from "@material-ui/icons";
import firebase from "firebase";
import React, { cloneElement, useContext, useEffect, useState } from "react";
import { Button, Container, Modal } from "react-bootstrap";
import { Offline, Online } from "react-detect-offline";
import { Link, Route, Switch } from "react-router-dom";
import Logout from "../../components/Logout";
import Sidebar from "../../components/Sidebar";
import { ButtonToolTip } from "../../components/Tooltips";
import Colours from "../../constants/Colours";
import { Context } from "../../context/Store";
import Admin from "./admin/Admin";
import Banned from "./Banned";
import Browser from "./Browser";
import AddChat from "./chat/AddChat";
import Room from "./chat/Room";
import RoomManager from "./chat/RoomManager";
import Information from "./Information";
import "./Landing.css";
import Profile from "./settings/Profile";
import SecurityComponent from "./settings/security/Security";
export default function Landing(p) {
    //Store
    const [state, dispatch] = useContext(Context);
    //Constants
    const PATH = "/app";
    const PROFILE_PATH = PATH + "/profile";
    const SECURITY_PATH = PATH + "/security";
    const MY_ROOMS_PATH = PATH + "/myRooms";
    const ADD_CHAT_PATH = PATH + "/addChat";
    const ROOM_PATH = PATH + "/room/:id";
    const ROOM_SETTINGS_PATH = PATH + "/roomSettings/:id"
    const INFO_PATH = PATH + "/info";
    const ADMIN_PATH = PATH + "/admin";
    const EXIT_PATH = PATH + "/exit";
    //Functions, hooks and data.
    const iconStyle = { color: Colours.white, fontSize: 35 }
    const pages = [
        {
            name: "Home",
            icon: <Home />,
            path: PATH
        },
        {
            name: "Your Rooms",
            icon: <ForumOutlined />,
            path: MY_ROOMS_PATH
        },
        {
            name: "Profile",
            icon: <Person />,
            path: PROFILE_PATH
        },
        {
            name: "Add Room",
            icon: <GroupAdd />,
            path: ADD_CHAT_PATH
        },
        {
            name: "Security",
            icon: <Security />,
            path: SECURITY_PATH
        },
        {
            name: "Information",
            icon: <InfoOutlined />,
            path: INFO_PATH
        },
        state.isAdmin ? {
            name: "Administration",
            icon: <Computer />,
            path: ADMIN_PATH
        } : null,
        {
            name: "Logout",
            icon: <ExitToApp />,
            path: EXIT_PATH
        },
    ]
    const routes = [
        {
            path: PROFILE_PATH,
            component: Profile
        },
        {
            path: SECURITY_PATH,
            component: SecurityComponent
        },
        {
            path: ADD_CHAT_PATH,
            component: AddChat
        },
        {
            path: ROOM_PATH,
        },
        {
            path: ROOM_SETTINGS_PATH,
            component: RoomManager
        },
        {
            path: MY_ROOMS_PATH,
            component: Browser
        },
        {
            path: EXIT_PATH,
            component: Logout
        },
        {
            path: ADMIN_PATH,
            component: Admin
        },
        {
            path: INFO_PATH,
            component: Information
        },
        {
            path: PATH,
            component: Browser
        },


    ]
    const containerStyle = { marginLeft: "18%" };
    const toolbarStyle = { marginLeft: "12.5%" }
    const foldSideBar = () => {
        setComponentState({
            ...componentState,
            container: { ...containerStyle, marginLeft: "80px" },
            sidebar: { width: "70px", overflowX: "hidden" },
            toolbar: { marginLeft: "65px" },
            buttonInnerHtml: <UnfoldMore />,
        })
    }
    const unfoldSideBar = () => {
        setComponentState({
            ...componentState,
            container: containerStyle,
            sidebar: { width: "13%", overflowX: "auto" },
            toolbar: toolbarStyle,
            buttonInnerHtml: <UnfoldLess />,
        })
    }
    const [buttonState, setButtonState] = useState({ colour: "", func: null });
    const [componentState, setComponentState] = useState({
        container: containerStyle,
        sidebar: {},
        toolbar: toolbarStyle,
        buttonInnerHtml: <UnfoldLess />,
    })
    const [folded, setFolded] = useState(false);
    const user = firebase.auth().currentUser;
    if (!user)
        dispatch({ payload: false, type: "SET_AUTH" })
    const userRef = firebase.database().ref(`users/${user.uid}`);
    const sidebarUserSetting = userRef.child("sidebar");
    useEffect(() => sidebarUserSetting.get().then(setting => setting.val() ? triggerFold() : null)
        .catch(() => setOffline(true))
        .catch(e => console.log(e))
        // eslint-disable-next-line react-hooks/exhaustive-deps
        , [])
    const triggerFold = () => {
        foldSideBar();
        setFolded(true);
        setButtonState(state => ({ ...state, func: triggerUnfold }));
        sidebarUserSetting.set(true).catch(e => console.log(e));
    }
    const triggerUnfold = () => {
        unfoldSideBar();
        setFolded(false);
        setButtonState(state => ({ ...state, func: triggerFold }));
        sidebarUserSetting.set(false).catch(e => console.log(e));
    }
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    window.addEventListener('resize', () => setWindowWidth(window.innerWidth));
    useEffect(() => {
        const screen = window.screen.availWidth
        if (screen - windowWidth > screen / 100 * 15) {
            foldSideBar();
            setButtonState(state => ({ ...state, func: null, colour: Colours.red }));
        }
        else {
            if (!folded) {
                unfoldSideBar();
                setButtonState(state => ({ ...state, func: triggerFold, colour: Colours.white }));
            }
            else
                setButtonState(state => ({ ...state, func: triggerUnfold, colour: Colours.white }));

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowWidth])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => dispatch({ type: "SET_MESSAGE_LISTENER", payload: [] }), [])
    //Assign admin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => userRef.child("isAdmin").get().then(async d => dispatch({ type: "SET_ADMIN", payload: await d.val() })), []);
    //Check if user is banned
    const [restriction, setRestriction] = useState("None");
    useEffect(() => userRef.child("restriction").get().then(d => d.exists() ? d.val() : "None").then(restriction => setRestriction(restriction)))
    const [offline, setOffline] = useState(false);
    const offlineModal = (show, message) =>
        <Modal show={show} backdrop="static">
            <Modal.Header>
                <Modal.Title>Connection Offline</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
                <Button variant="info" onClick={() => window.location.reload()}>Reload</Button>
            </Modal.Footer>
        </Modal>
    const routeMaker = (r, k) => <Route path={r.path} component={r.component} key={k} />
    return (
        <div className="Landing">
            <Sidebar style={componentState.sidebar}>
                <ButtonToolTip arrow placement="right" title="Toggle Sidebar">
                    <button
                        onClick={buttonState.func}
                        onMouseEnter={() => {
                            if (buttonState.func != null)
                                setButtonState(state => ({ ...state, colour: Colours.blue }))
                        }}
                        onMouseLeave={() => {
                            if (buttonState.func != null)
                                setButtonState(state => ({ ...state, colour: Colours.white }))
                        }}
                        style={{ all: "unset" }} id="sidebarFolderButton">
                        {cloneElement(componentState.buttonInnerHtml, { style: { fontSize: 50, color: buttonState.colour, transform: "rotate(90deg)", marginLeft: "10px" }, id: "sidebarFolder" })}
                    </button>
                </ButtonToolTip>
                <List>
                    <div className="navItem" />
                    {pages.map((p, key) => {
                        return (p ?
                            <Link key={key} to={p.path} style={{ cursor: "default" }} onClick={() => state.messageListener.forEach(listener => listener.off("value") && listener.off("child_changed"))}>
                                <div className="navItem">
                                    <ButtonToolTip title={p.name} arrow placement="right">
                                        <ListItem>
                                            <ListItemIcon>
                                                {cloneElement(p.icon, { style: iconStyle })}
                                            </ListItemIcon>
                                            <ListItemText>
                                                <label style={{ fontSize: 25, whiteSpace: "nowrap" }}>{p.name}</label>
                                            </ListItemText>
                                        </ListItem>
                                    </ButtonToolTip>
                                </div>
                            </Link>
                            : ""
                        )
                    }
                    )}
                </List>
            </Sidebar>
            <div style={{ ...componentState.toolbar, transition: ".5s", paddingLeft: "3%", backgroundColor: Colours.toolbar, height: 60, borderBottomColor: Colours.white, borderWidth: 3, borderBottomStyle: "solid", display: "flex", justifyContent: "space-between", paddingRight: "5%", alignItems: "center" }}>
                <h1>Welcome, {firebase.auth().currentUser.displayName}</h1>
            </div>
            <Container style={{ ...componentState.container, transition: ".5s" }} id="container">
                <Switch>
                    {restriction !== "Total" ? routes.map(routeMaker) : [{ path: EXIT_PATH, component: Logout }, { path: PATH, component: Banned }].map(routeMaker)}
                </Switch>
            </Container>
            <Route path={ROOM_PATH}>
                <Room folded={buttonState.colour === Colours.red || folded} />
            </Route>
            <Online>
                {offlineModal(offline, "There's a problem with the server. Please try again later.")}
            </Online>
            <Offline>
                {offlineModal(true, "You're currently offline. Please check your connection.")}
            </Offline>
        </div >
    )
}