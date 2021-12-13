import firebase from "firebase";
export default function getProvider(account) {
    switch (account) {
        case "google": return new firebase.auth.GoogleAuthProvider();
        case "facebook": return new firebase.auth.FacebookAuthProvider();
        case "github": return new firebase.auth.GithubAuthProvider();
        default: return
    }
}