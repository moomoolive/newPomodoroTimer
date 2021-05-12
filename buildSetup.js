const fs = require(`fs`)

const targetDirectory = `./dist`

if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory)
}

const targetFilesToCopy = [`timer.mp3`, `favicon.ico`]
const copyFileToDestination = (filename) => {
    const targetDestination = targetDirectory + `/${filename}`
    return fs.copyFile(filename, targetDestination, (err) => {
        if (err) {
            console.error(err)
            throw err
        } else {
            console.log(`Successfully copied file: ${filename} to ${targetDirectory}`)
        }
    })
}

targetFilesToCopy.forEach(f => copyFileToDestination(f))