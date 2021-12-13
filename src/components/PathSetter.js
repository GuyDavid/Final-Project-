import React, { useContext, useEffect } from "react";
import { Context } from "../context/Store";
export default function PathSetter() {
    const APP_PATH = "/app";
    const CURRENT_PATH = window.location.pathname
    const [, dispatch] = useContext(Context)
    useEffect(() => {
        if (CURRENT_PATH.startsWith(APP_PATH) && CURRENT_PATH !== APP_PATH + "/exit")
            dispatch({ type: "SET_PATH", payload: CURRENT_PATH })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CURRENT_PATH])
    return <div />
}