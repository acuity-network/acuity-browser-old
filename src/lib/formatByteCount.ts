function formatByteCount(bytes, digits = 2) {
	if (bytes < 1000) return bytes + ' B'
	bytes /= 1000
	let i = Math.floor(Math.log(bytes) / Math.log(1000))
	let units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	return (bytes / (1000 ** i)).toFixed(digits) + ' ' + units[i]
}

export default formatByteCount
