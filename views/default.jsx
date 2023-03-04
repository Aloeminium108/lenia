const React = require('react')

function Def (html) {
    return (
        <html>
            <head>
                <title>Lenia</title>
                <link rel="stylesheet" href="/css/style.css" />
            </head>
            <body>
                {/*<script src="https://greggman.github.io/webgl-memory/webgl-memory.js" crossOrigin></script>*/}
                {html.children}
            </body>
        </html>
    )
  }
  

module.exports = Def
