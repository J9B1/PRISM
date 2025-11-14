// PRISM — Electron App Setup
const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

app.setName("PRISM");

// Background Behavior Tweaks
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

app.once("ready", () => {
    app.setPath("userData", path.join(__dirname, "prism-data"));
});

// PRISM Window Settings
const GAME_URL = "https://lom.joynetgame.com/";
const ASPECT = 0.5619;
const SCALE = 0.95;
const BORDER_RADIUS = 15;

function createWindow() {
    const display = screen.getPrimaryDisplay();
    const { height: screenH } = display.workAreaSize;

    const innerH = Math.round(screenH * SCALE);
    const innerW = Math.round(innerH * ASPECT);

    const win = new BrowserWindow({
        width: innerW,
        height: innerH,
        resizable: false,
        frame: false,
        icon: path.join(__dirname, "icon.ico"),
        transparent: true,
        backgroundColor: "#00000000",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            backgroundThrottling: false
        }
    });

    win.loadURL(GAME_URL);

    // PRISM Overlay + HUD Injection
    win.webContents.on("did-finish-load", () => {
        win.webContents.executeJavaScript(`
            if (!document.getElementById("prism-panel")) {
                const panel = document.createElement("div");
                panel.id = "prism-panel";
                document.body.appendChild(panel);
            }

            if (!document.getElementById("prism-hud")) {
                const hud = document.createElement("div");
                hud.id = "prism-hud";
                document.getElementById("prism-panel").appendChild(hud);
            }

            function updateHUD() {
                const start = new Date("2025-09-11T00:00:00Z");
                const nowUTC = new Date();
                const now = new Date(nowUTC.getTime() + (2 * 60 * 60 * 1000));

                const diff = now - start;
                const day = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

                let hours = now.getHours();
                const minutes = now.getMinutes().toString().padStart(2, "0");
                const seconds = now.getSeconds().toString().padStart(2, "0");
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12;
                hours = hours ? hours : 12;

                document.getElementById("prism-hud").innerHTML =
                    "Day " + day + "<br>" +
                    hours + ":" + minutes + ":" + seconds + " " + ampm;
            }

            setInterval(updateHUD, 1000);
            updateHUD();
        `);

        // PRISM Stylesheet Injection
        win.webContents.insertCSS(`
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                border-radius: ${BORDER_RADIUS}px !important;
                background: transparent !important;
            }

            #GameDiv, canvas {
                border-radius: ${BORDER_RADIUS}px !important;
                overflow: hidden !important;
            }

            #prism-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 36%;
                height: 5.5%;
                max-height: 150px;
                background: rgba(0,0,0,0.35);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border-top-right-radius: ${BORDER_RADIUS}px;
                border-bottom-left-radius: ${BORDER_RADIUS}px;
                z-index: 999999998 !important;
                pointer-events: none;
            }

            #prism-hud {
                position: absolute;
                top: 50%;
                right: 50%;
                transform: translate(50%, -50%);
                text-align: center;
                width: 100%;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: bold;
                line-height: 1.2;
                color: white;
                text-shadow: 0 0 4px rgba(0,0,0,0.9);
                z-index: 999999999 !important;
                pointer-events: none;
            }
        `);
    });
}

app.whenReady().then(createWindow);
