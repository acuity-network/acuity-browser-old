function formatByteCount(bytes: number) {
	let i = Math.floor(Math.log(bytes) / Math.log(1000))
	let units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	return (bytes / (1000 ** i)).toLocaleString() + ' ' + units[i]
}

export default formatByteCount
