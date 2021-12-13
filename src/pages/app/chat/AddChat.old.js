import firebase from "firebase";
import React, { useState } from "react";
import { Alert, Button, Container, Form, Image } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import { fieldsClass } from "../../../constants/Classes";
import Colours from "../../../constants/Colours";
export default function AddChat(p) {
    const sampleImage = "/assets/img/chat.png";
    //Database
    const database = firebase.database();
    const user = firebase.auth().currentUser;
    const roomsRef = database.ref("rooms");
    const userRef = database.ref("users/" + user.uid + "/managedRooms")
    //States
    const [notification, setNotification] = useState("");
    const [roomID, setRoomID] = useState("");
    const [image, setImage] = useState(sampleImage)
    //Functions, other hooks and variables
    const isSample = image === sampleImage;
    const addRoom = async () => {
        const name = document.getElementById(NAME).value;
        const game = document.getElementById(GAME).value;
        const description = document.getElementById(DESCRIPTION).value;
        if (name.length > 0 && game.length > 0 && description.length > 0)
            try {
                const r = await roomsRef.push({
                    name: name,
                    game: game,
                    description: description,
                    managers: { [user.uid]: user.uid },
                    owners: { [user.uid]: user.uid }
                });
                const key = r.key
                userRef.child(key).set(key);
                let selectedImage = sampleImage;
                if (!isSample) {
                    const storageRef = firebase.storage().ref("room_images/" + key + "/room_image")
                    await storageRef.put(await (await fetch(image)).blob());
                    selectedImage = await storageRef.getDownloadURL();
                }
                await roomsRef.child(key).child("photo").set(selectedImage)
                setRoomID(key);
            }
            catch (e) {
                console.log(e);
                setNotification("Adding room failed. Please check connection.")
            }
        else setNotification("Please check validity of fields.")
    }
    const NAME = "name";
    const GAME = "game";
    const DESCRIPTION = "description";
    if (roomID.length > 0)
        return <Redirect to={"/app/room/" + roomID} />
    return (
        <Container >
            <h1>Add Room</h1>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name of Room</Form.Label>
                    <Form.Control className={fieldsClass} type="text" placeholder="Eg: Portal 2 mapping, TF2 matchmaking, etc" id={NAME} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Game</Form.Label>
                    <Form.Control className={fieldsClass} type="text" placeholder="Eg: Portal 2, Team Fortress 2, Counter Strike: Global Offensive, etc" id={GAME} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control className={fieldsClass} type="text" placeholder="Eg: This room is for meeting up for TF2 matchmaking, etc" id={DESCRIPTION} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Image</Form.Label>
                    <br />
                    <Image src={image} style={{ border: "3px solid", borderColor: Colours.gray, borderRadius: 20, width: "30%" }} alt="Profile" id="image" />
                </Form.Group>
                <Form.Label className="btn btn-primary mb-4" style={{ width: "15%" }} htmlFor="upload-button">Upload Image</Form.Label>
                <input id="upload-button" type="file" accept="image/*" className="btn btn-primary" style={{ display: "none" }}
                    onChange={e => setImage(URL.createObjectURL(e.target.files[0]))} />
                <br />
                <Button variant="success" onClick={addRoom} className="mb-3" style={{ width: "10%" }}>Add Room</Button>
                <br />
                <Alert variant="primary" show={notification.length > 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                    </svg>
                    {notification}
                </Alert>
            </Form>
        </Container>
    );
}