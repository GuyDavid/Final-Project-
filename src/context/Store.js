import React, { createContext, useReducer } from "react";
import Reducer from '../functions/Reducer';


const initialState = {
    auth: false,
    appPath: "/app",
    error: null,
    messageListener: [],
    isAdmin: false
};
const Store = ({ children }) => {
    const [state, dispatch] = useReducer(Reducer, initialState);
    return (
        <Context.Provider value={[state, dispatch]}>
            {children}
        </Context.Provider>
    )
};
export const Context = createContext(initialState);
export default Store;