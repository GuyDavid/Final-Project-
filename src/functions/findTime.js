const findTime = time => {
    const date = new Date(time);
    return (date.getTime() > new Date().getTime() - 86400000) ? date.toLocaleTimeString() : date.toLocaleDateString()
}
export default findTime;