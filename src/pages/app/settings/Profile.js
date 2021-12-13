import { FormControlLabel, Switch } from "@material-ui/core";
import firebase from "firebase";
import React, { useEffect, useState } from "react";
import { Button, Container, Form, Image, Alert } from "react-bootstrap";
import { fieldsClass } from "../../../constants/Classes";
import Colours from "../../../constants/Colours";
export default function Profile(p) {
    //Constants
    const samplePhoto = "/assets/img/profile_sample.png";
    //Database
    const user = firebase.auth().currentUser;
    const profileStorageRef = firebase.storage().ref().child(`profile_pics/${user.uid}/profile_picture`);
    const ref = firebase.database().ref(`users/${user.uid}`);
    const profileRef = ref.child("profile");
    const usesPhoto = ref.child("usesPhoto");
    //States
    const [profile, setProfile] = useState({
        nickname: user.displayName,
        favGames: "",
        profilePicture: samplePhoto,
        steamProfile: "",
        epicProfileName: ""
    })
    const [notification, setNotification] = useState("");
    //Functions, other hooks and variables
    const isSample = profile.profilePicture === samplePhoto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => usesPhoto.get().then(d => d.val() ? setProfile({ ...profile, profilePicture: user.photoURL }) : setProfile({ ...profile, profilePicture: samplePhoto })), []);
    const untickPhoto = () => {
        setProfile({ ...profile, profilePicture: samplePhoto });
        document.getElementById("upload-button").value = "";
    }
    const tickPhoto = () => {
        setProfile({ ...profile, profilePicture: user.photoURL });
    }
    const updateProfile = async () => {
        if (profile.nickname == null) {
            setNotification("Please write a nickname.");
            return;
        }
        if (ref !== undefined) {
            console.log("update profile");
            let url = user.photoURL;
            user.updateProfile({ displayName: profile.nickname })
            try {
                if (!isSample) {
                    usesPhoto.set(true);
                    const res = await fetch(profile.profilePicture);
                    if (res.ok) {
                        console.log("pootis");
                        await profileStorageRef.put(await (res).blob());
                        url = await profileStorageRef.getDownloadURL()
                        user.updateProfile({ photoURL: url })
                    }
                }
                else usesPhoto.set(false);
            }
            catch (e) {
                console.log(e);
            }
            await profileRef.set({ nickname: profile.nickname, favGames: profile.favGames, profilePhoto: url, steamProfile: profile.steamProfile, epicProfileName: profile.epicProfileName })
            setNotification("Profile updated successfully.");
        }
    }
    useEffect(() => {
        const getProfile = () => {
            async function getter() {
                console.log("getting profile");
                let profile = await profileRef.get();
                if (profile.exists()) {
                    setProfile(profileOriginal => ({ ...profileOriginal, ...profile.val() }));
                }
                console.log(user.uid);
            }
            if (ref !== undefined)
                getter();
        }
        getProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    console.log(profile);
    return (
        <Container>
            <h1>Profile</h1>
            <Form>
                <Form.Group className="mb-3" controlId="nicknameGroup" >
                    <Form.Label>Nickname</Form.Label>
                    <Form.Control onChange={e => setProfile({ ...profile, nickname: e.target.value })} className={fieldsClass} type="text" placeholder="Eg: Muselk, ster_, Jerma985, etc" value={profile.nickname} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="favGroup">
                    <Form.Label>Favourite Games</Form.Label>
                    <Form.Control onChange={e => setProfile({ ...profile, favGames: e.target.value })} className={fieldsClass} type="text" placeholder="Eg: Portal 2, Team Fortress 2, etc" value={profile.favGames} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="favGroup">
                    <Form.Label>Steam Profile URL</Form.Label>
                    <Form.Control onChange={e => setProfile({ ...profile, steamProfile: e.target.value.slice(27) })} className={fieldsClass} type="text" value={"https://steamcommunity.com/" + profile.steamProfile} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="favGroup">
                    <Form.Label>Epic Profile Name</Form.Label>
                    <Form.Control onChange={e => setProfile({ ...profile, epicProfileName: e.target.value })} className={fieldsClass} type="text" value={profile.epicProfileName} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Profile Photo</Form.Label>
                    <Form.Group controlId="usePhoto" className="mb-3">
                        <FormControlLabel label="Use profile photo" control={
                            <Switch color="primary" id="sampleTick" checked={!isSample} onChange={e => e.target.checked ? tickPhoto() : untickPhoto()} />
                        } />
                    </Form.Group>
                    <Image src={profile.profilePicture} style={{ border: "3px solid", borderColor: Colours.gray, borderRadius: 20, width: "30%" }} alt="Profile" id="profilePhoto" />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="btn btn-primary" style={{ width: "15%", minWidth: "75px" }} htmlFor="upload-button">Upload Photo</Form.Label>
                    <input id="upload-button" type="file" accept="image/*" className="btn btn-primary" style={{ display: "none" }}
                        onChange={e => setProfile({ ...profile, profilePicture: URL.createObjectURL(e.target.files[0]) })} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Button onClick={updateProfile} variant="success" style={{ width: "10%", minWidth: "65px" }}>Apply</Button>
                </Form.Group>
            </Form>
            <Alert variant="info" show={notification.length > 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                </svg>
                {notification}
            </Alert>
        </Container >
    )
}