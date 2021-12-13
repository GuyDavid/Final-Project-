const Reducer = (state, action) => {
    switch (action.type) {
        case 'SET_AUTH':
            return {
                ...state,
                auth: action.payload
            };
        case 'SET_PATH':
            return {
                ...state,
                appPath: action.payload
            };
        case 'SET_MESSAGE_LISTENER':
            return {
                ...state,
                messageListener: action.payload
            }
        case "SET_ADMIN":
            return {
                ...state,
                isAdmin: action.payload
            }
        default:
            return state;
    }
};
export default Reducer;