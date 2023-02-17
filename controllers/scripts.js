const router = require('express').Router()
const fs = require('fs')



router.get('/:script', (req, res) => {

    var script

    fs.readFile(`./scripts/${req.params.script}`, (error, file) => {
        if (error) {
            res.status(404).send("404 not found")
            return
        }
        script = file

        res.writeHeader(200, {
            "Content-Type": "text/javascript",
        })

        res.write(script)
        res.end()
    })

    
})

module.exports = router