import firebase from "firebase";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Modal, Table, Image } from "react-bootstrap";
import { Redirect, useParams } from "react-router-dom";
import { fieldsClass } from "../../../constants/Classes";
import { Context } from "../../../context/Store";
import Colours from "../../../constants/Colours";
import { ArrowDropDownOutlined } from "@material-ui/icons";

export default function RoomManagernew(p) {
    const roomID = useParams().id;
    //Database
    const database = firebase.database();
    const user = firebase.auth().currentUser;
    const roomRef = database.ref("rooms/" + roomID);
    //const managerRef = roomRef.child("managers");
    const joinedUsersRef = roomRef.child("joinedUsers");
    const usersRef = database.ref("users");
    //const bannedUsersRef = roomRef.child("bannedUsers");
    //States
    const [room, setRoom] = useState({});
    const [isValidRoom, setIsValidRoom] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [confirm, setConfirm] = useState("");
    const [users, setUsers] = useState([]);
    const [searchRes, setSearchRes] = useState([])
    const [showManagerNote, setShowManagerNote] = useState("");
    const [showBannedNote, setShowBannedNote] = useState("");
    const [deleted, setDeleted] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [state, dispatch] = useContext(Context)
    //References
    //const isManager = useRef(false);
    //const isOwner = useRef(false);
    //Functions and other hooks
    const hideDelete = () => setShowDelete(false);
    const search = e => {
        const word = e.target.value;
        const filter = u => u.name.toLowerCase().includes(word.toLowerCase()) || u.key.toLowerCase().includes(word.toLowerCase());
        const joinedRes = users.filter(filter);
        setSearchRes(joinedRes)
    }
    useEffect(() => {
        const getData = async () => {
            const data = await roomRef.get();
            if (!data.exists()) {
                setIsValidRoom(false);
                return;
            }
            else {
                setRoom(await data.val());
            }
            const isManagerCheck = (userRes) => {
                if (!userRes)
                    return;
                const userKeys = Object.keys(userRes);
                setUsers([]);
                userKeys.forEach(key => database.ref("users/" + key + "/profile").child("nickname").get()
                    .then(async d => {
                        if (d.exists()) {
                            if (key === user.uid) {
                                setIsManager(userRes[key].isManager || state.isAdmin);
                                setIsOwner(userRes[key].isOwner || state.isAdmin);
                            }
                            const name = await d.val();
                            const adder = users => users.concat({
                                name: name,
                                key: key,
                                isManager: userRes[key].isManager ? true : false,
                                isOwner: userRes[key].isOwner ? true : false,
                                isBanned: userRes[key].isBanned ? true : false
                            });
                            setUsers(adder);
                        }
                    }
                    ))
            }
            joinedUsersRef.on("value", d => isManagerCheck(d.val()))
            dispatch({ type: "SET_MESSAGE_LISTENER", payload: [joinedUsersRef] })
            setIsReady(true);
        }
        getData();
    }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        , [user.uid])
    if (!isValidRoom)
        return <Redirect to="/app" />
    if (!isReady)
        return <div />
    const applyChanges = async () => {
        roomRef.child("name").set(room.name);
        roomRef.child("description").set(room.description);
        roomRef.child("game").set(room.game);
        const ref = firebase.storage().ref("room_images/" + roomID + "/room_image");
        await ref.put(await (await fetch(room.photo)).blob());
        const url = await ref.getDownloadURL();
        roomRef.child("photo").set(url);
    }
    const leaveRoom = () => database.ref("users/" + user.uid + "/joinedRooms/" + roomID).remove().then(() => setDeleted(true));
    const deleteRoom = () => roomRef.remove()
        .then(() => usersRef.child(user.uid).child("managedRooms").child(roomID).remove())
        .then(() => firebase.storage().ref("room_images/" + roomID).delete().catch(e => console.log(e)))
        .then(leaveRoom)
    const addManager = manager => {
        if (manager.length > 0)
            usersRef.child(manager).get()
                .then(d => d.exists())
                .then(exists => exists ? joinedUsersRef.child(manager).child("isManager").set(true) && usersRef.child(manager).child("managedRooms").child(roomID).set(roomID) && window.location.reload() : setShowManagerNote("User ID doesn't exist. Please check you typed the correct ID."))
        else setShowManagerNote("Please type user ID in the field.")
    }
    if (deleted)
        return <Redirect to="/app/myRooms" />
    /*const inOwners = key => {
        for (const owner of owners) {
            if (owner.key === key)
                return true
        }
        return false;
    }
    const inManagers = key => {
        for (const manager of managers) {
            if (manager.key === key)
                return true
        }
        return false;
    }
    const isBanned = key => {
        for (const banned of bannedUsers) {
            if (banned.key === key)
                return true
        }
        return false;
    }*/
    const isCurrentUser = key => key === user.uid;
    const removeManager = key => {
        joinedUsersRef.child(key).child("isManager").set(false);
        usersRef.child(key).child("managedRooms").child(roomID).remove()
        window.location.reload();
    }
    const removeUser = key => {
        removeManager(key);
        joinedUsersRef.child(key).remove();
        window.location.reload();
    }
    const banUser = key => {
        if (key.length > 0) {
            usersRef.child(key).get()
                .then(d => d.exists())
                .then(exists => exists
                    ? (joinedUsersRef.child(key).child("isBanned").set(true)
                        && usersRef.child(key).child("bannedRooms").child(roomID).set(roomID)
                        && removeManager(key)
                        && window.location.reload())
                    : setShowBannedNote("User ID doesn't exist. Please check you typed the correct ID.")
                );
        }
        else setShowBannedNote("Please type user ID in the field.")
    }
    const unbanUser = key => {
        joinedUsersRef.child(key).child("isBanned").set(false);
        usersRef.child(key).child("bannedRooms").child(roomID).remove().catch(e => console.log(e));
    }
    const searchArr = searchRes.length > 0 ? searchRes : users;
    return (
        <Container>
            <h1>{room.name} Settings</h1>
            <Form.Group className="mb-3">
                <Form.Label>Room name</Form.Label>
                <Form.Control className={fieldsClass} value={room.name} onChange={e => setRoom({ ...room, name: e.target.value })} disabled={!isOwner} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Room description</Form.Label>
                <Form.Control className={fieldsClass} value={room.description} onChange={e => setRoom({ ...room, description: e.target.value })} disabled={!isOwner} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Game</Form.Label>
                <Form.Control className={fieldsClass} value={room.game} onChange={e => setRoom({ ...room, game: e.target.value })} disabled={!isOwner} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Thumbnail</Form.Label>
                <br />
                <Image src={room.photo} style={{ border: "3px solid", borderColor: Colours.gray, borderRadius: 20, width: "30%" }} alt="Profile" id="profilePhoto" />
            </Form.Group>
            {isOwner ? <Form.Group className="mb-3">
                <Form.Label className="btn btn-primary" style={{ width: "15%", minWidth: "75px" }} htmlFor="upload-button">Upload Photo</Form.Label>
                <input id="upload-button" type="file" accept="image/*" className="btn btn-primary" style={{ display: "none" }}
                    onChange={e => setRoom({ ...room, photo: URL.createObjectURL(e.target.files[0]) })} />
            </Form.Group> : ""}
            {isOwner ?
                <Form.Group className="mb-5">
                    <Button variant="success" onClick={applyChanges}>Apply</Button>
                </Form.Group> : null}
            <Form.Group className="mb-3">
                <Button variant="danger" disabled={isOwner /*&& owners.length === 1*/} onClick={leaveRoom}>Leave Room</Button>
            </Form.Group>
            {isOwner ? <Button variant="danger" className="mb-3" onClick={() => setShowDelete(true)}>Delete Room</Button> : null}
            <br />
            <Form.Group className="mb-3">
                <Form.Label>Search Users</Form.Label>
                <Form.Control className={fieldsClass} placeholder="Type in user name or ID" onClick={search} onChange={search} />
            </Form.Group>
            <Form.Label>Managers</Form.Label>
            <ArrowDropDownOutlined />
            {isOwner ?
                <Form.Group className="mb-3">
                    <Form.Label>Add Manager</Form.Label>
                    <Form.Control id="addManagerField" className={fieldsClass + " mb-3"} placeholder="Type in user ID" disabled={!isOwner} />
                    <Button variant="info" onClick={() => addManager(document.getElementById("addManagerField").value)}>Add</Button>
                </Form.Group> : null}
            <Alert variant="primary" show={showManagerNote.length > 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
                {showManagerNote}
            </Alert>
            <Table variant="dark" className="mb-5">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>User ID</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {searchArr.map((m, i) =>
                        m.isManager ?
                            <tr key={i}>
                                <td>{m.name}</td>
                                <td>{m.key}</td>
                                {(!m.isOwner && isOwner) || isCurrentUser(m.key) ? <td><Button disabled={isOwner /*&& owners.length === 1*/ && isCurrentUser(m.key)} variant="danger" onClick={() => removeManager(m.key)}>{isCurrentUser(m.key) ? "Quit Management" : "Remove Manager"}</Button></td> : <td />}
                            </tr>
                            : "")}
                </tbody>
            </Table>
            {isManager ? <Form.Group className="mb-3">
                <Form.Group className="mb-3">
                    <Form.Label>Banned Users</Form.Label>
                    <br />
                    <Form.Label>Ban User</Form.Label>
                    <Form.Control id="banUserField" className={fieldsClass + " mb-3"} placeholder="Type in user ID" />
                    <Button variant="danger" onClick={() => banUser(document.getElementById("banUserField").value)}>Add</Button>
                </Form.Group>
                <Alert variant="primary" show={showBannedNote.length > 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                    </svg>
                    {showBannedNote}
                </Alert>
                <Table variant="dark" className="mb-5">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>User ID</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {searchArr.map((m, i) =>
                            m.isBanned ?
                                <tr key={i}>
                                    <td>{m.name}</td>
                                    <td>{m.key}</td>
                                    <td><Button variant="success" onClick={() => unbanUser(m.key)}>Unban User</Button></td>
                                </tr> : "")}
                    </tbody>
                </Table>
            </Form.Group>
                : ""}
            <Form.Label>
                All Users
            </Form.Label>
            <Table variant="dark">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>User ID</th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {searchArr.map((m, i) => !m.isBanned
                        ?
                        <tr key={i}>
                            <td>{m.name}</td>
                            <td>{m.key}</td>
                            {!m.isOwner && isManager && !isCurrentUser(m.key) ? <td><Button variant="danger" onClick={() => removeUser(m.key)}>Remove User</Button></td> : <td />}
                            {!m.isOwner && isManager && !isCurrentUser(m.key) ? <td><Button variant="danger" onClick={() => banUser(m.key)}>Ban User</Button></td> : <td />}
                            {!m.isManager && isOwner && !isCurrentUser(m.key) ? <td><Button variant="info" onClick={() => addManager(m.key)}>Add To Managers</Button></td> : <td />}
                        </tr>
                        :
                        <div key={i} />)
                    }
                </tbody>
            </Table>
            <Modal show={showDelete} onHide={hideDelete} >
                <Modal.Header closeButton>
                    <Modal.Title>Delete Room</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete your room? Type <b>{room.name}</b> to confirm.</p>
                    <Form.Control value={confirm} onChange={e => setConfirm(e.target.value)} className={fieldsClass} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={hideDelete}>Cancel</Button>
                    <Button disabled={confirm !== room.name} variant="danger" onClick={deleteRoom}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    )
}