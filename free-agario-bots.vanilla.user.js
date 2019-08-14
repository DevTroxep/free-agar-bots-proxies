// ==UserScript==
// @name         Free Agar.io Bots (Vanilla Version)
// @version      1.0.4
// @description  Free open source agar.io bots
// @author       Nel
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// @match        *://agar.io/*
// @connect      sonnybuchan.co.uk
// ==/UserScript==

const CLIENT_VERSION = '1.0.4'

class Writer {
    constructor(size){
        this.dataView = new DataView(new ArrayBuffer(size))
        this.byteOffset = 0
    }
    writeUint8(value){
        this.dataView.setUint8(this.byteOffset++, value)
    }
    writeInt32(value){
        this.dataView.setInt32(this.byteOffset, value, true)
        this.byteOffset += 4
    }
    writeUint32(value){
        this.dataView.setUint32(this.byteOffset, value, true)
        this.byteOffset += 4
    }
    writeString(string){
        for(let i = 0; i < string.length; i++) this.writeUint8(string.charCodeAt(i))
        this.writeUint8(0)
    }
}

window.buffers = {
    startBots(url, protocolVersion, clientVersion, userStatus, botsName, botsAmount){
        const writer = new Writer(13 + url.length + botsName.length)
        writer.writeUint8(0)
        writer.writeString(url)
        writer.writeUint32(protocolVersion)
        writer.writeUint32(clientVersion)
        writer.writeUint8(Number(userStatus))
        writer.writeString(botsName)
        writer.writeUint8(botsAmount)
        return writer.dataView.buffer
    },
    mousePosition(x, y){
        const writer = new Writer(9)
        writer.writeUint8(6)
        writer.writeInt32(x)
        writer.writeInt32(y)
        return writer.dataView.buffer
    }
}

window.connection = {
    ws: null,
    connect(){
        this.ws = new WebSocket(`ws://${window.server.host}:${window.server.port}`)
        this.ws.binaryType = 'arraybuffer'
        this.ws.onopen = this.onopen.bind(this)
        this.ws.onmessage = this.onmessage.bind(this)
        this.ws.onclose = this.onclose.bind(this)
    },
    send(buffer){
        if(this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(buffer)
    },
    onopen(){
        document.getElementById('userStatus').style.color = '#00C02E'
        document.getElementById('userStatus').innerText = 'Connected'
        document.getElementById('connect').disabled = true
        document.getElementById('startBots').disabled = false
        document.getElementById('stopBots').disabled = false
    },
    onmessage(message){
        const dataView = new DataView(message.data)
        switch(dataView.getUint8(0)){
            case 0:
                document.getElementById('startBots').disabled = true
                document.getElementById('stopBots').disabled = false
                document.getElementById('startBots').style.display = 'none'
                document.getElementById('stopBots').style.display = 'inline'
                document.getElementById('stopBots').innerText = 'Stop Bots'
                window.user.startedBots = true
                break
            case 1:
                document.getElementById('stopBots').disabled = true
                document.getElementById('stopBots').innerText = 'Stopping Bots...'
                break
            case 2:
                document.getElementById('botsAI').style.color = '#DA0A00'
                document.getElementById('botsAI').innerText = 'Disabled'
                document.getElementById('startBots').disabled = false
                document.getElementById('stopBots').disabled = true
                document.getElementById('startBots').style.display = 'inline'
                document.getElementById('stopBots').style.display = 'none'
                document.getElementById('stopBots').innerText = 'Stop Bots'
                window.user.startedBots = false
                window.bots.ai = false
                break
            case 3:
                alert('Your IP has captcha and bots are unable to spawn, change your ip with a VPN or something to one that doesn\'t has captcha in order to use the bots')
                break
        }
    },
    onclose(){
        document.getElementById('userStatus').style.color = '#DA0A00'
        document.getElementById('userStatus').innerText = 'Disconnected'
        document.getElementById('botsAI').style.color = '#DA0A00'
        document.getElementById('botsAI').innerText = 'Disabled'
        document.getElementById('connect').disabled = false
        document.getElementById('startBots').disabled = true
        document.getElementById('stopBots').disabled = true
        document.getElementById('startBots').style.display = 'inline'
        document.getElementById('stopBots').style.display = 'none'
        window.user.startedBots = false
        window.bots.ai = false
    }
}

window.server = {
    host: 'localhost',
    port: 8083
}

window.game = {
    url: '',
    protocolVersion: 0,
    clientVersion: 0
}

window.user = {
    startedBots: false,
    isAlive: false,
    mouseX: 0,
    mouseY: 0,
    offsetX: 0,
    offsetY: 0,
    macroFeedInterval: null
}

window.bots = {
    name: '',
    amount: 0,
    ai: false
}

window.keys = {
    splitBotsKey: 't',
    feedBotsKey: 'a',
    aiBotsKey: 'f',
    macroFeedKey: 'e',
    doubleSplitKey: 'q',
    sixteenSplitKey: 'r'
}

window.settings = {
    extendedZoom: false,
    hideMapGrid: false
}

function modifyCore(core){
    return core
        .replace(/if\(\w+\.MC&&\w+\.MC\.onPlayerSpawn\)/, `
            $&
            window.user.isAlive = true
            if(window.user.startedBots) window.connection.send(new Uint8Array([5, Number(window.user.isAlive)]).buffer)
        `)
        .replace(/if\(\w+\.MC&&\w+\.MC\.onPlayerDeath\)/, `
            $&
            window.user.isAlive = false
            if(window.user.startedBots) window.connection.send(new Uint8Array([5, Number(window.user.isAlive)]).buffer)
        `)
        .replace(/new\s+WebSocket\((\w+\(\w+\))\)/, `
            $&
            if(window.user.startedBots) window.connection.send(new Uint8Array([1]).buffer)
            window.game.url = $1
            window.user.isAlive = false
            window.user.macroFeedInterval = null
        `).replace(/(\w+)=~~\(\+\w+\[\w+\+\d+>>3]\+\s+\+\(\(\w+\[\w+\+\d+>>2]\|0\)-\(\(\w+\[\d+]\|0\)\/2\|0\)\|0\)\/\w+\);(\w+)=~~\(\+\w+\[\w+\+\d+>>3]\+\s+\+\(\(\w+\[\w+\+\d+>>2]\|0\)-\(\(\w+\[\d+]\|0\)\/2\|0\)\|0\)\/\w+\)/, `
            $&
            window.user.mouseX = $1 - window.user.offsetX
            window.user.mouseY = $2 - window.user.offsetY
            if(window.user.startedBots && window.user.isAlive) window.connection.send(window.buffers.mousePosition(window.user.mouseX, window.user.mouseY))
        `)
        .replace(/\w+\[\w+\+272>>3]=(\w+);\w+\[\w+\+280>>3]=(\w+);\w+\[\w+\+288>>3]=(\w+);\w+\[\w+\+296>>3]=(\w+)/, `
            $&
            if(~~($3 - $1) === 14142 && ~~($4 - $2) === 14142){
                window.user.offsetX = ($1 + $3) / 2
                window.user.offsetY = ($2 + $4) / 2
            }
        `)
        .replace(/;if\((\w+)<1\.0\)/, ';if($1 < (window.settings.extendedZoom ? 0.05 : 1))')
        .replace(/(\w+\(\d+,\w+\|0,\.5,\.5\)\|0);(\w+\(\d+,\w+\|0,\.5,50\.5\)\|0);(\w+\(\d+,\w+\|0,\.5,\.5\)\|0);(\w+\(\d+,\w+\|0,50\.5,\.5\)\|0)/, `
            $1
            if(!window.settings.hideMapGrid) $2
            $3
            if(!window.settings.hideMapGrid) $4
        `)
}

function setKeysEvents(){
    document.addEventListener('keydown', e => {
        if(!document.getElementById('overlays')){
            switch(e.key){
                case window.keys.splitBotsKey:
                    if(window.user.startedBots && window.user.isAlive) window.connection.send(new Uint8Array([2]).buffer)
                    break
                case window.keys.feedBotsKey:
                    if(window.user.startedBots && window.user.isAlive) window.connection.send(new Uint8Array([3]).buffer)
                    break
                case window.keys.aiBotsKey:
                    if(window.user.startedBots && window.user.isAlive){
                        if(!window.bots.ai){
                            document.getElementById('botsAI').style.color = '#00C02E'
                            document.getElementById('botsAI').innerText = 'Enabled'
                            window.bots.ai = true
                            window.connection.send(new Uint8Array([4, Number(window.bots.ai)]).buffer)
                        }
                        else {
                            document.getElementById('botsAI').style.color = '#DA0A00'
                            document.getElementById('botsAI').innerText = 'Disabled'
                            window.bots.ai = false
                            window.connection.send(new Uint8Array([4, Number(window.bots.ai)]).buffer)
                        }
                    }
                    break
                case window.keys.macroFeedKey:
                    if(!window.user.macroFeedInterval){
                        window.core.eject()
                        window.user.macroFeedInterval = setInterval(window.core.eject, 80)
                    }
                    break
                case window.keys.doubleSplitKey:
                    window.core.split()
                    setTimeout(window.core.split, 40)
                    break
                case window.keys.sixteenSplitKey:
                    window.core.split()
                    setTimeout(window.core.split, 40)
                    setTimeout(window.core.split, 80)
                    setTimeout(window.core.split, 120)
                    break
            }
        }
    })
    document.addEventListener('keyup', e => {
        if(!document.getElementById('overlays') && e.key === window.keys.macroFeedKey && window.user.macroFeedInterval){
            clearInterval(window.user.macroFeedInterval)
            window.user.macroFeedInterval = null
        }
    })
}

function setGUI(){
    document.getElementById('advertisement').innerHTML = `
        <h2 id="botsInfo">
            <a href="https://discord.gg/SDMNEcJ" target="_blank">Free Agar.io Bots</a>
        </h2>
        <h5 id="botsAuthor">
            Developed by <a href="https://www.youtube.com/channel/UCZo9WmnFPWw38q65Llu5Lug" target="_blank">Nel</a>
        </h5>
        <span id="statusText">Status: <b id="userStatus">Disconnected</b></span>
        <br>
        <br>
        <span id="aiText">Bots AI: <b id="botsAI">Disabled</b></span>
        <br>
        <input type="text" id="botsName" placeholder="Bots Name" maxlength="15" spellcheck="false">
        <input type="number" id="botsAmount" placeholder="Bots Amount" min="10" max="185" spellcheck="false">
        <button id="connect">Connect</button>
        <br>
        <button id="startBots" disabled>Start Bots</button>
        <button id="stopBots">Stop Bots</button>
        <br>
        <button id="options">Options</button>
        <div id="optionsPanel">
            <input type="text" id="serverHost" placeholder="Server Host/IP" value="localhost" spellcheck="false">
            <input type="text" id="serverPort" placeholder="Server Port" value="8083" maxlength="5" spellcheck="false">
            <br>
            <br>
            <span style="margin-top: 10px;"><b>Keys value must be between [a-z] (lowercase) or [0-9]</b></span>
            <input type="text" id="splitBotsKey" placeholder="Bots Split Key" value="t" maxlength="1" spellcheck="false">
            <input type="text" id="feedBotsKey" placeholder="Bots Feed Key" value="a" maxlength="1" spellcheck="false">
            <input type="text" id="aiBotsKey" placeholder="Bots AI Key" value="f" maxlength="1" spellcheck="false">
            <input type="text" id="macroFeedKey" placeholder="Macro Feed Key" value="e" maxlength="1" spellcheck="false">
            <input type="text" id="doubleSplitKey" placeholder="Double Split Key" value="q" maxlength="1" spellcheck="false">
            <input type="text" id="sixteenSplitKey" placeholder="Sixteen Split Key" value="r" maxlength="1" spellcheck="false">
            <br>
            <br>
            <span>Extended Zoom: </span><input type="checkbox" id="extendedZoom">
            <span>Hide Map Grid: </span><input type="checkbox" id="hideMapGrid">
        </div>
    `
    if(localStorage.getItem('localStoredBotsName') !== null){
        window.bots.name = localStorage.getItem('localStoredBotsName')
        document.getElementById('botsName').value = window.bots.name
    }
    if(localStorage.getItem('localStoredBotsAmount') !== null){
        window.bots.amount = JSON.parse(localStorage.getItem('localStoredBotsAmount'))
        document.getElementById('botsAmount').value = String(window.bots.amount)
    }
    if(localStorage.getItem('localStoredServerHost') !== null){
        window.server.host = localStorage.getItem('localStoredServerHost')
        document.getElementById('serverHost').value = window.server.host
    }
    if(localStorage.getItem('localStoredServerPort') !== null){
        window.server.port = JSON.parse(localStorage.getItem('localStoredServerPort'))
        document.getElementById('serverPort').value = String(window.server.port)
    }
    const keys = ['splitBotsKey', 'feedBotsKey', 'aiBotsKey', 'macroFeedKey', 'doubleSplitKey', 'sixteenSplitKey']
    for(const key of keys){
        if(localStorage.getItem(`localStored${key}`) !== null){
            window.keys[key] = localStorage.getItem(`localStored${key}`)
            document.getElementById(key).value = window.keys[key]
        }
    }
    const settings = ['extendedZoom', 'hideMapGrid']
    for(const setting of settings){
        if(localStorage.getItem(`localStored${setting}`) !== null){
            window.settings[setting] = JSON.parse(localStorage.getItem(`localStored${setting}`))
            document.getElementById(setting).checked = window.settings[setting]
        }
    }
}

function setGUIStyle(){
    document.getElementsByTagName('head')[0].innerHTML += `
        <style type="text/css">
            #mainui-ads {
                height: 410px !important;
            }
            #botsInfo > a, #botsAuthor > a {
                color: #3894F8;
                text-decoration: none;
            }
            #botsAuthor {
                margin-top: -15px;
                letter-spacing: 1px;
            }
            #statusText, #aiText {
                font-weight: bold;
            }
            #userStatus, #botsAI {
                color: #DA0A00;
            }
            #botsName, #botsAmount, #optionsPanel > input {
                margin-top: 15px;
                width: 144px;
                border: 1px solid black;
                border-radius: 5px;
                padding: 8px;
                font-size: 14.5px;
                outline: none;
            }
            #botsName:focus, #botsAmount:focus, #optionsPanel > input:focus {
                border-color: #7D7D7D;
            }
            #connect, #startBots, #stopBots, #options {
                color: white;
                border: none;
                border-radius: 5px;
                padding: 7px;
                width: 160px;
                font-size: 18px;
                outline: none;
                margin-top: 15px;
                letter-spacing: 1px;
            }
            #connect {
                display: inline;
                margin-left: 5px;
                background-color: #0074C0;
            }
            #startBots {
                display: inline;
                background-color: #00C02E;
            }
            #stopBots {
                display: none;
                background-color: #DA0A00;
            }
            #options {
                display: inline;
                background-color: #C08900;
            }
            #optionsPanel {
                display: none;
                margin: auto;
                position: absolute;
                top: 0px;
                left: 0px;
                bottom: 0px;
                right: 0px;
                width: 550px;
                height: 300px;
                background-color: white;
                z-index: 9999;
                border: 3px solid black;
                border-radius: 5px;
                padding: 10px;
            }
            #connect:active {
                background-color: #004E82;
            }
            #startBots:active {
                background-color: #009A25;
            }
            #stopBots:active {
                background-color: #9A1B00;
            }
            #options:active {
                background-color: #8A6300;
            }
        </style>
    `
}

function setGUIEvents(){
    document.getElementById('botsAmount').addEventListener('keypress', e => {
        e.preventDefault()
    })
    document.getElementById('botsName').addEventListener('change', function(){
        window.bots.name = this.value
        localStorage.setItem('localStoredBotsName', window.bots.name)
    })
    document.getElementById('botsAmount').addEventListener('change', function(){
        window.bots.amount = Number(this.value)
        localStorage.setItem('localStoredBotsAmount', window.bots.amount)
    })
    document.getElementById('connect').addEventListener('click', () => {
        if(!window.connection.ws || window.connection.ws.readyState !== WebSocket.OPEN) window.connection.connect()
    })
    document.getElementById('startBots').addEventListener('click', () => {
        if(window.game.url && window.game.protocolVersion && window.game.clientVersion && !window.user.startedBots){
            if(window.bots.name && window.bots.amount && !document.getElementById('socialLoginContainer')) window.connection.send(window.buffers.startBots(window.game.url, window.game.protocolVersion, window.game.clientVersion, window.user.isAlive, window.bots.name, window.bots.amount))
            else alert('Bots name and amount are required before starting the bots, also you need to be logged in to your agar.io account in order to start the bots')
        }
    })
    document.getElementById('stopBots').addEventListener('click', () => {
        if(window.user.startedBots) window.connection.send(new Uint8Array([1]).buffer)
    })
    document.getElementById('options').addEventListener('click', () => {
        if(window.getComputedStyle(document.getElementById('optionsPanel')).display === 'none') document.getElementById('optionsPanel').style.display = 'block'
        else document.getElementById('optionsPanel').style.display = 'none'
    })
    document.getElementById('serverHost').addEventListener('change', function(){
        window.server.host = this.value
        localStorage.setItem('localStoredServerHost', window.server.host)
    })
    document.getElementById('serverPort').addEventListener('change', function(){
        window.server.port = Number(this.value)
        localStorage.setItem('localStoredServerPort', window.server.port)
    })
    const keys = ['splitBotsKey', 'feedBotsKey', 'aiBotsKey', 'macroFeedKey', 'doubleSplitKey', 'sixteenSplitKey']
    for(const key of keys){
        document.getElementById(key).addEventListener('change', function(){
            window.keys[key] = this.value
            localStorage.setItem(`localStored${key}`, window.keys[key])
        })
    }
    const settings = ['extendedZoom', 'hideMapGrid']
    for(const setting of settings){
        document.getElementById(setting).addEventListener('change', function(){
            window.settings[setting] = this.checked
            localStorage.setItem(`localStored${setting}`, window.settings[setting])
        })
    }
}

WebSocket.prototype.storedSend = WebSocket.prototype.send
WebSocket.prototype.send = function(buffer){
    this.storedSend(buffer)
    const dataView = new DataView(new Uint8Array(buffer).buffer)
    if(!window.game.protocolVersion && dataView.getUint8(0) === 254) window.game.protocolVersion = dataView.getUint32(1, true)
    else if(!window.game.clientVersion && dataView.getUint8(0) === 255) window.game.clientVersion = dataView.getUint32(1, true)
}

GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://sonnybuchan.co.uk/version.txt',
    onload(res1){
        if(res1.responseText.split(';')[0].split('=')[1] === CLIENT_VERSION){
            new MutationObserver(mutations => {
                mutations.forEach(({addedNodes}) => {
                    addedNodes.forEach(node => {
                        if(node.nodeType === 1 && node.tagName === 'SCRIPT' && node.src && node.src.includes('agario.core.js')){
                            node.type = 'javascript/blocked'
                            node.parentElement.removeChild(node)
                            fetch(node.src)
                                .then(res => res.text())
                                .then(core => {
                                    Function(modifyCore(core))()
                                    setKeysEvents()
                                    setTimeout(() => {
                                        setGUI()
                                        setGUIStyle()
                                        setGUIEvents()
                                    }, 3500)
                                })
                        }
                    })
                })
            }).observe(document.documentElement, {
                childList: true,
                subtree: true
            })
        }
        else {
            window.stop()
            alert('Outdated client version, join our discord server to get latest version: https://discord.gg/SDMNEcJ')
        }
    }
})
