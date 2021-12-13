import firebase from "firebase";
import React, { useContext, useState } from "react";
import { Button, Container, Form, Modal, Alert } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import MyModal from "../../../../components/MyModal";
import { fieldsClass } from "../../../../constants/Classes";
import { Context } from "../../../../context/Store";
import getProvider from "../../../../functions/getProvider";
import FirebaseExceptions from "../../../../constants/FirebaseExceptions";
export default function Security(p) {
    //Constants
    const EMAIL = "email";
    const PASSWORD = "password";
    const CONFIRM_PASSWORD = "confirmPassword";
    const RECENT_LOGIN_ERROR = 'auth/requires-recent-login';
    const PASSWORD_REAUTH = "passwordReauth";
    const CHECK_PASSWORD_MESSAGE = "Please check your password";
    //Database
    const auth = firebase.auth();
    const user = auth.currentUser;
    const [currentEmail, setCurrentEmail] = useState(user.email);
    const database = firebase.database();
    const userRef = database.ref(`users/${user.uid}`);
    //States
    const [state, dispatch] = useContext(Context)
    const [confirm, setConfirm] = useState("");
    const [showDelete, setShowDelete] = useState(false);
    const [showReauthenticationModal, setShowReauthenticationModal] = useState(false);
    const [notification, setNotification] = useState({ variant: "", text: "" });
    //Functions, other hooks and variables
    const provider = user.providerData[0].providerId.split(".")[0];
    const isNotEmail = provider !== PASSWORD;
    const hideDelete = () => setShowDelete(false);
    const changeEmail = () => {
        const email = document.getElementById(EMAIL).value;
        user.updateEmail(email)
            .then(() => userRef.child(`${provider}/email`).set(email))
    }
    const changePassword = () => {
        //Make prompt
        const password = document.getElementById(PASSWORD).value;
        if (password === document.getElementById(CONFIRM_PASSWORD).value)
            setShowReauthenticationModal({
                show: true,
                func: async () => {
                    try {
                        await signInPassword();
                        await user.updatePassword(password)
                        setNotification({ variant: "success", text: "Password changed successfully." })
                    }
                    catch (e) {
                        passwordError(e);
                        if (e.code === "auth/weak-password")
                            setNotification({ variant: "info", text: "Password is too weak." })
                    }
                    finally {
                        setShowReauthenticationModal({ show: false })
                    }
                }

            })
        else setNotification({ variant: "danger", text: "Please check your new password matches the confirmation" });
    }
    const deleteAccount = async () => {
        setShowDelete(false);
        try {
            await firebase.storage().ref(`profile_pics/${user.uid}`).delete().catch(e => console.log(e))
            console.log("continue");
            await userRef.child("joinedRooms").get().then(rooms => rooms.val())
                .then(rooms => Object.keys(rooms).forEach(key => {
                    const roomRef = database.ref("rooms/" + key)
                    roomRef.child("managers").child(user.uid).remove();
                    roomRef.child("owners").child(user.uid).remove();
                    roomRef.child("joinedUsers").child(user.uid).remove();
                })).catch(e => console.log(e))
            await userRef.remove().catch(e => console.log(e))
            await user.delete();
            dispatch({ type: "SET_AUTH", payload: false })
        }
        catch (e) {
            if (e.code === RECENT_LOGIN_ERROR)
                if (provider === "password") {
                    setShowReauthenticationModal({ show: true, func: reauthenticateFromModal })
                }
                else reauthenticate().then(() => deleteAccount());
        }
    }
    const reauthenticate = async () => {
        if (provider !== "password")
            await user.reauthenticateWithPopup(getProvider(provider)).catch(e => console.log(e));
        //Make email password option.
        else {
            setShowReauthenticationModal({ show: true, func: deleteAccount });
        }
    }
    const hideReauthenticationModal = () => setShowReauthenticationModal({ show: false });
    const reauthenticateFromModal = async () => {
        try {
            await signInPassword();
            deleteAccount();
        }
        catch (e) {
            passwordError(e);
        }
        finally {
            setShowReauthenticationModal({ show: false });
        }
    }
    const signInPassword = async () => auth.signInWithEmailAndPassword(user.email, document.getElementById(PASSWORD_REAUTH).value)
    const passwordError = e => {
        if (e.code === FirebaseExceptions.wrongPassword) {
            setNotification({ variant: "danger", text: CHECK_PASSWORD_MESSAGE })
        }
    }
    if (!state.auth) {
        return <Redirect to="/" />
    }
    return (
        <Container >
            <h1>Security</h1>
            <Form>
                <Form.Group controlId="emailGroup" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control className={fieldsClass} type="email" placeholder="Eg: name@domain.com" id={EMAIL} disabled={isNotEmail} value={currentEmail} onChange={e => setCurrentEmail(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Button variant="danger" onClick={changeEmail} disabled={isNotEmail}>Change Email</Button>
                </Form.Group>
                <Form.Group controlId="passwordGroup" className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control className={fieldsClass} type="password" placeholder="Type password here" id={PASSWORD} disabled={isNotEmail} />
                </Form.Group>
                <Form.Group controlId="confirmGroup" className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control type="password" className={fieldsClass} placeholder="Type password here" id={CONFIRM_PASSWORD} disabled={isNotEmail} />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Button variant="danger" onClick={changePassword} disabled={isNotEmail}>Change Password</Button>
                </Form.Group>
                <Form.Group className="mb-4">
                    <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Account</Button>
                </Form.Group>
            </Form>
            <Alert variant={notification.variant} transition show={notification.text.length > 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
                {notification.text}
            </Alert>
            <Modal show={showDelete} onHide={hideDelete} >
                <Modal.Header closeButton>
                    <Modal.Title>Delete Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete your account? Type <b>{user.email}</b> to confirm.</p>
                    <p>You might have to reauthenticate if a long time has passed since you signed in.</p>
                    <Form.Control value={confirm} onChange={e => setConfirm(e.target.value)} className={fieldsClass} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={hideDelete}>Cancel</Button>
                    <Button disabled={confirm !== user.email} variant="danger" onClick={deleteAccount}>Confirm</Button>
                </Modal.Footer>
            </Modal>
            <MyModal
                show={showReauthenticationModal.show}
                onHide={hideReauthenticationModal}
                title={"Reauthenticate Account"}
                body={
                    <Modal.Body>
                        <p>You must reauthenticate your account to delete or make changes to it.</p>
                        <Form.Group>
                            <Form.Label>Type your password</Form.Label>
                            <Form.Control className={fieldsClass} type="password" placeholder="Password" id={PASSWORD_REAUTH} />
                        </Form.Group>
                    </Modal.Body>
                }
                footer={
                    <Modal.Footer>
                        <Button variant="danger" onClick={showReauthenticationModal.func}>Apply</Button><Button onClick={hideReauthenticationModal}>Cancel</Button>
                    </Modal.Footer>}
            />
        </Container >
    )
}