require('dotenv').config()
const express = require('express')
const fs = require('fs')

var html

fs.readFile('./index.html', (error, file) => {
    if (error) throw error
    html = file
})

const app = express()

app.use('/', require('./controllers/scripts'))

app.get('/', (req, res) => {
    res.write(html)
    res.end()
})

app.get('*', (req, res) => {
    res.status(404).send('<h1>404 page</h1>')
})

app.listen(process.env.PORT)