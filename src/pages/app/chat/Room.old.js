import { TextareaAutosize } from "@material-ui/core";
import { SettingsOutlined } from "@material-ui/icons";
import firebase from "firebase";
import React, { memo, useContext, useEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Link, Redirect, useParams } from "react-router-dom";
import MyModal from "../../../components/MyModal";
import { ButtonToolTip } from "../../../components/Tooltips";
import { fieldsClass } from "../../../constants/Classes";
import Colours from "../../../constants/Colours";
import { Context } from "../../../context/Store";
function Room(p) {
    const roomID = useParams().id;
    //Database
    const database = firebase.database();
    const user = firebase.auth().currentUser;
    const roomRef = database.ref("rooms/" + roomID);
    const messagesRef = roomRef.child("messages");
    const usersRef = database.ref("users");
    //States
    const [roomData, setRoomData] = useState({
        name: "Loading",
        messages: ""
    });
    const [usersObj, setUsersObj] = useState({})
    const [ready, setReady] = useState(false);
    const [validRoom, setValidRoom] = useState(true);
    const [settingsButtonColour, setSettingsButtonColour] = useState(Colours.white)
    const [profile, setProfile] = useState({ show: false, steamProfile: "", favGames: "", epicProfileName: "" })
    const [linkWarning, setLinkWarning] = useState({ show: false, link: "" })
    const [isManager, setIsManager] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const chatbox = useRef(null);
    const [state, dispatch] = useContext(Context);
    //Functions, other hooks and variables.
    const getMessages = async d => {
        setRoomData({
            name: d.child("name").val(),
            messages: d.child("messages").val(),
            game: d.child("game").val(),
        })
        const users = await d.child("joinedUsers").val();
        let userKeys = [];
        if (users != null) {
            userKeys = Object.keys(users);
        }
        const bannedUsers = await d.child("bannedUsers").val();
        if (bannedUsers)
            for (const banned of Object.keys(bannedUsers)) {
                if (banned === user.uid) {
                    setIsBanned(true);
                }
            }

        roomRef.child("joinedUsers/" + user.uid).set(user.uid);
        usersRef.child(user.uid + "/joinedRooms/" + roomID).set(roomID);
        userKeys.forEach(key => usersRef.child(key).get()
            .then(d => setUsersObj(usersObj => { return { ...usersObj, [key]: d.val() } })))
        const managers = await d.child("managers").val();
        if (managers != null) {
            for (const manager of Object.keys(managers)) {
                if (manager === user.uid || state.isManager)
                    setIsManager(true);
            }
        }

    }
    useEffect(() =>
        roomRef.get()
            .then(d => {
                if (d.exists())
                    getMessages(d);
                else {
                    setValidRoom(false);
                    throw new Error("Room doesn't exist");
                }
            })
            .then(() => setReady(true))
            .then(() => roomRef.on("value", d => d.exists() ? getMessages(d) : null))
            .then(() => dispatch({ type: "SET_MESSAGE_LISTENER", payload: [roomRef] }))
            .catch(e => console.log(e))
        // eslint-disable-next-line react-hooks/exhaustive-deps
        , [dispatch])
    const sendMessage = e => {
        const target = e.target;
        const content = target.value;
        if (e.key === "Enter") {
            e.preventDefault()
            if (content.length > 0) {
                if (e.shiftKey) {
                    target.value += "\n";
                }
                else {
                    let uploadContent = ""
                    const strArr = content.split("\n")
                    while (strArr.length > 0) {
                        const line = strArr.pop();
                        // eslint-disable-next-line eqeqeq
                        if (!line == "") {
                            strArr.push(line);
                            break;
                        }
                    }
                    const breaker = str => {
                        if (str.length < 70) {
                            return str + "\n";
                        }
                        return str.substring(0, 70) + "\n" + breaker(str.substring(70));
                    }
                    strArr.forEach(line => uploadContent += breaker(line));
                    const date = new Date();
                    messagesRef.child(date + user.uid).set({ content: uploadContent, userID: user.uid, timestamp: date + "" });
                    messageArr.length = 0;
                    setTimeout(() => {
                        target.value = null;
                        if (chatbox.current)
                            chatbox.current.scroll({ top: chatbox.current.scrollHeight, behavior: "smooth" })
                    }, 1);
                }
            }
        }
    }
    const deleteMessage = key => messagesRef.child(key).remove();
    const backToMain = <Redirect to="/app" />
    if (!validRoom)
        return backToMain;
    if (isBanned && !state.isAdmin)
        return backToMain;
    if (!ready)
        return <div />
    const messageArr = [];
    if (roomData.messages != null)
        Object.keys(roomData.messages).forEach(k => messageArr.push(roomData.messages[k]))
    return (
        <div style={{ marginLeft: p.folded ? "70px" : "13%", transition: ".5s" }}>
            <div style={{ paddingLeft: "3%", backgroundColor: Colours.header, height: 60, borderBottomColor: Colours.white, borderWidth: 3, borderBottomStyle: "solid", display: "flex", justifyContent: "space-between", paddingRight: "5%", alignItems: "center" }}>
                <h1>{roomData.name}</h1>
                <h2>{roomData.game}</h2>
                <ButtonToolTip arrow title="Room Settings" placeholder="bottom" >
                    <Link to={"/app/roomSettings/" + roomID} style={{ all: "unset" }} onMouseEnter={() => setSettingsButtonColour(Colours.blue)} onMouseLeave={() => setSettingsButtonColour(Colours.white)}>
                        <SettingsOutlined style={{ color: settingsButtonColour, fontSize: 50 }} />
                    </Link>
                </ButtonToolTip>
            </div>
            <div style={{ paddingLeft: "7%", overflowX: "auto", height: "80vh" }} ref={chatbox}>
                {messageArr.map((m, k) =>
                    <div key={k} style={{ flexDirection: "row", display: "flex" }}>
                        {m.userID === user.uid || isManager ? <button style={{ color: Colours.white, background: "none", border: "none", height: 0 }}
                            onClick={() => deleteMessage(m.timestamp + m.userID)}>X</button> : ""}
                        <p style={{ fontSize: 18, whiteSpace: "pre-line" }}>
                            <button onClick={() => usersObj[m.userID] ? setProfile({
                                ...usersObj[m.userID].profile,
                                show: true,
                                usesPhoto: usersObj[m.userID].usesPhoto,
                                id: m.userID,
                            }) : null} style={{ fontWeight: "bolder", background: "none", border: "none", color: Colours.blue }}>{usersObj[m.userID] != null ? usersObj[m.userID].profile.nickname : "Deleted User"}</button>: {m.content.split(" ").map((t, k) => t.match(/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/) ? <span key={k}><button style={{ all: "unset", color: Colours.blue }} onClick={() => setLinkWarning({ show: true, link: "https://" + t })}>{t}</button> </span> : t + " ")}
                        </p>
                    </div>)}
            </div>
            <TextareaAutosize style={{ marginLeft: "3%", width: "50%", resize: "none" }} type="text" onKeyDown={sendMessage} className={fieldsClass + " form-control"} placeholder="Type your message here." wrap="hard" />
            <MyModal
                show={profile.show}
                onHide={() => setProfile({ ...profile, show: false })}
                title={profile.nickname}
                body={
                    <Modal.Body>
                        <img src={profile.usesPhoto ? profile.profilePhoto : "/assets/img/profile_sample.png"} style={{ borderColor: Colours.white, borderRadius: 30, borderWidth: 3, borderStyle: "solid", backgroundColor: Colours.black, width: 250 }} alt="Profile" />
                        <br />
                        <p>User ID: {profile.id}</p>
                        {profile.favGames ? <p>Favourite Games: {profile.favGames}</p> : ""}
                        {profile.steamProfile ? <a target="_blank" rel="noreferrer" href={"https://steamcommunity.com/" + profile.steamProfile}>Steam Profile</a> : ""}
                        {profile.epicProfileName ? <p>Epic Profile Name: {profile.epicProfileName}</p> : ""}
                    </Modal.Body>
                }
            />
            <MyModal
                show={linkWarning.show}
                onHide={() => setLinkWarning({ show: false })}
                title={"External Link"}
                body={<Modal.Body><p>This link leads to an external website not affiliated with this one. Are you sure you want to continue?</p></Modal.Body>}
                footer={
                    <Modal.Footer>
                        <Button variant="danger" href={linkWarning.link}>Yes</Button><Button onClick={() => setLinkWarning({ show: false })}>No</Button>
                    </Modal.Footer>
                } />
        </div >
    )
}
export default memo(Room);