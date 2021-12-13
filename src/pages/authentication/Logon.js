import firebase from "firebase";
import React, { useContext, useState } from "react";
import { Alert, Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { Link, Redirect, Route, Switch } from "react-router-dom";
import { fieldsClass } from "../../constants/Classes";
import FirebaseExceptions from "../../constants/FirebaseExceptions";
import { Context } from "../../context/Store";
import getProvider from "../../functions/getProvider";
export default function Logon(p) {
    //Provider login symbols
    const providerLogins = [
        {
            src: "./assets/img/google_symbol.svg",
            value: "google"
        },
        {
            src: "./assets/img/GitHub-Mark-Light-120px-plus.png",
            value: "github"
        }
    ]
    const auth = firebase.auth();
    //States
    const [state, dispatch] = useContext(Context);
    const [notification, setNotification] = useState("");
    const [linkPopup, setLinkPopup] = useState(false);
    const [accountOptions, setAccountOptions] = useState([]);
    const [credential, setCredential] = useState();

    let user;
    //Check if user signed in or is already signed in.
    auth.onAuthStateChanged(async user => {
        if (user != null) {
            const provider = splitFromTopDomain(user.providerData[0].providerId);
            console.log(user.displayName);
            await addUserToDataBase(provider, provider === "password" && user.displayName == null ? document.getElementById(NICKNAME).value : user.displayName, user).catch(e => console.log(e))
            dispatch({ type: "SET_AUTH", payload: true });
        }
    })
    const connectionMessage = "Please check your connection.";
    //Functions
    const logon = async (email, password) => {
        auth.signInWithEmailAndPassword(email, password)
            .catch(e => {
                const message = "Login failed. ";
                switch (e.code) {
                    case FirebaseExceptions.wrongPassword: setNotification(message + "Please check your password."); break;
                    case FirebaseExceptions.invalidEmail:
                    case 'auth/user-not-found': setNotification(message + "User doesn't exist."); break;
                    default: setNotification(message + connectionMessage)

                }
            })
    };
    const register = async (email, password) => {
        const nickname = document.getElementById(NICKNAME).value;
        const message = "Registration failed. ";
        if (nickname.length === 0) {
            setNotification(message + "Please type in a nickname. It can be changed later.");
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .catch(e => {
                switch (e.code) {
                    case FirebaseExceptions.weakPassword: setNotification(message + "Password is too weak."); break;
                    case FirebaseExceptions.invalidEmail: setNotification(message + "Email is invalid."); break;
                    case 'auth/email-already-in-use': setNotification(message + "Account with this email already exists. Check if you already registered with a third party account."); break;
                    default: setNotification(message + connectionMessage);
                }
            })
    };
    const registerWithProvider = async p => {
        const provider = getProvider(p);
        try {
            user = await auth.signInWithPopup(provider).user;
            return user;
        }
        catch (e) {
            switch (e.code) {
                case 'auth/account-exists-with-different-credential':
                    setAccountOptions(await auth.fetchSignInMethodsForEmail(e.email));
                    setLinkPopup(true);
                    setCredential(e.credential);
                    break;
                default:
                    console.log(e);
            }
        }
    };
    const linkWithUser = () => registerWithProvider(splitFromTopDomain(document.getElementById("providerSelector").value)).then(user => user.linkWithCredential(credential)).catch(e => console.log(e));
    const addUserToDataBase = async (account, nickname, user) => {
        const ref = firebase.database().ref(`users/${user.uid}`);
        const profile = ref.child("profile");
        if (!(await ref.get()).exists()) {
            //check
            await user.updateProfile({ displayName: nickname });
            ref.child(account).set(
                {
                    email: user.email
                }
            )
            profile.set(
                {
                    nickname: nickname,
                    favGames: "",
                    profilePhoto: user.photoURL ? user.photoURL : "/assets/img/profile_sample.png"
                }
            )
        }
        else
            user.updateProfile({
                photoURL: await (await profile.child("profilePhoto").get()).val(),
                displayName: await (await profile.child("nickname").get()).val()
            })
    };
    const hidePopup = () => setLinkPopup(false);
    const splitFromTopDomain = str => str.split(".")[0]
    const enterKey = e => e.key === "Enter" ? document.getElementById(APPLY).click() : null;
    //ID constants
    const EMAIL = "email";
    const PASSWORD = "password";
    const NICKNAME = "nickname";
    const APPLY = "apply";
    const REGISTER_LINK = `/register`;
    const isRegister = window.location.pathname === REGISTER_LINK;
    if (state.auth) {
        return <Redirect to={state.appPath} />;
    }
    return (
        <Container style={{ textAlign: "center", paddingTop: "5%" }}>
            <h1>Welcome to Game Mate</h1>
            <h3>Sign up or Log in with existing account</h3>
            <div style={{ flexDirection: "row", display: "flex", alignItems: "center" }}>

                <div style={{ width: "200%" }}>
                    <Form style={{ textAlign: "left" }}>
                        <Form.Group >
                            <Form.Label>Email</Form.Label>
                            <Form.Control className={fieldsClass} type="email" placeholder="eg: name@example.com" id={EMAIL} onKeyPress={enterKey} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Password</Form.Label>
                            <Form.Control className={fieldsClass} type="password" placeholder="Password" id={PASSWORD} onKeyPress={enterKey} />
                        </Form.Group>
                        <Switch>
                            <Route path={REGISTER_LINK} exact>
                                <Form.Group>
                                    <Form.Label>Nickname</Form.Label>
                                    <Form.Control className={fieldsClass} type="text" placeholder="eg: masterGamer78" id={NICKNAME} />
                                </Form.Group>
                                <br />
                                <Row xs={"auto"}>
                                    <Col>
                                        <Link to="/">
                                            <Button variant="danger" >Back</Button>
                                        </Link>
                                    </Col>
                                    <Col>
                                        <Button
                                            id={APPLY}
                                            variant="success"
                                            onClick={() =>
                                                register(document.getElementById(EMAIL).value,
                                                    document.getElementById(PASSWORD).value)}>
                                            Sign Up
                                        </Button>
                                    </Col>
                                </Row>
                            </Route>
                            <Route path={`/`} >
                                <br />
                                <Row xs={"auto"}>
                                    <Col>
                                        <Button
                                            id={APPLY}
                                            variant="success"
                                            onClick={() =>
                                                logon(document.getElementById(EMAIL).value,
                                                    document.getElementById(PASSWORD).value)}>
                                            Login
                                        </Button>
                                    </Col>
                                    <Col>
                                        <Link to={REGISTER_LINK}>
                                            <Button variant="primary" >Sign Up</Button>
                                        </Link>
                                    </Col>
                                </Row>
                            </Route>
                        </Switch>
                    </Form>
                    <br />
                    <Row xs="auto">
                        {providerLogins.map((l, k) =>
                            <Col key={k}>
                                <input type="image" src={l.src} style={{ 'width': '75px', 'height': '75px' }} value={l.value} onClick={e => registerWithProvider(e.target.value)} alt={l.value} />
                            </Col>
                        )}
                    </Row>
                    <br />
                    <Alert variant="info" show={isRegister}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                        </svg>
                        If your email address belongs to one of the provided third parties' email services, please use that account instead. Any logon with those parties would otherwise override your basic email and password account with the third party account.
                    </Alert>
                    {<br />}
                    <Alert variant="primary" transition show={notification.length > 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                        </svg>
                        {notification}
                    </Alert>
                    <Modal show={linkPopup} onHide={hidePopup} backdrop="static">
                        <Modal.Header closeButton >
                            <Modal.Title>Duplicate email</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p>An account with that email address already exists.You might have logged into a third party account with a higher priority over your first account.Please log in to one of your accounts to link the new and old accounts.</p>
                            <Form.Select id="providerSelector">
                                {accountOptions.map(a => <option value={a}>{a.charAt(0).toUpperCase() + splitFromTopDomain(a.slice(1))}</option>)}
                            </Form.Select>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="danger" onClick={hidePopup}>Cancel</Button>
                            <Button variant="success" onClick={linkWithUser}>Login</Button>
                        </Modal.Footer>
                    </Modal>
                </div>
                <div style={{ width: "100%" }}>
                    <img src="./assets/img/logo.png" style={{ width: "100%" }} alt="logo" />
                </div>
            </div>
        </Container >
    )
}