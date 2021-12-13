import firebase from "firebase";
import React, { useContext } from "react";
import { Redirect } from "react-router-dom";
import { Context } from "../context/Store";
export default function Logout() {
    const [state, dispatch] = useContext(Context);
    firebase.auth().signOut().catch(e => console.log(e)).finally(() => dispatch({ type: "SET_AUTH", payload: false }));
    if (state.auth)
        return <div />
    return <Redirect to="/" />
}