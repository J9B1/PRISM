// -------------------------------------------------------
// PRISM — Electron App Setup
// -------------------------------------------------------
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");
let mainWindow = null;

app.setName("PRISM");

// -------------------------------------------------------
// PRISM — Electron Updater
// -------------------------------------------------------
const { autoUpdater } = require("electron-updater");

// -------------------------------------------------------
// Chromium Behaviour Tweaks
// -------------------------------------------------------
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

app.once("ready", () => {
    app.setPath("userData", path.join(__dirname, "prism-data"));
    autoUpdater.checkForUpdatesAndNotify();
});

// -------------------------------------------------------
// IPC Handlers
// -------------------------------------------------------
ipcMain.on("setAlwaysOnTop", (event, state) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(state);
});

// -------------------------------------------------------
// PRISM Window Settings
// -------------------------------------------------------
const GAME_URL = "https://lom.joynetgame.com/";
const ASPECT = 0.5619;
const SCALE = 0.95;
const BORDER_RADIUS = 15;

function createWindow() {
    const display = screen.getPrimaryDisplay();
    const { height: screenH } = display.workAreaSize;

    const innerH = Math.round(screenH * SCALE);
    const innerW = Math.round(innerH * ASPECT);

    mainWindow = new BrowserWindow({
        width: innerW,
        height: innerH,
        resizable: false,
        frame: false,
        icon: path.join(__dirname, "icon.ico"),
        transparent: true,
        backgroundColor: "#00000000",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            backgroundThrottling: false
        }
    });

    mainWindow.loadURL(GAME_URL);

    // -------------------------------------------------------
    // PRISM UI Injection
    // -------------------------------------------------------
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.executeJavaScript(`
            // Loading Screen
            if (!document.getElementById("prism-loading")) {
                const load = document.createElement("div");
                load.id = "prism-loading";
                load.innerHTML = \`
                    <div id="prism-loading-box">
                        <div id="prism-loading-title">PRISM Loading...</div>
                        <div id="prism-loading-bar"></div>
                    </div>
                \`;
                document.body.appendChild(load);
            }

            const hideLoader = () => {
                const loader = document.getElementById("prism-loading");
                if (loader) loader.style.opacity = "0";
                setTimeout(() => loader && loader.remove(), 300);
            };

            const waitForGame = setInterval(() => {
                if (document.getElementById("GameDiv")) {
                    clearInterval(waitForGame);
                    hideLoader();
                }
            }, 200);

            setTimeout(hideLoader, 3000);

            // Pin Button (default = NOT pinned → shows 📌)
            if (!document.getElementById("prism-pin")) {
                const pin = document.createElement("button");
                pin.id = "prism-pin";

                const pinned = localStorage.getItem("prismPinned") === "true";
                pin.innerHTML = pinned ? "📍" : "📌";
                document.body.appendChild(pin);

                pin.addEventListener("click", () => {
                    const newState = !(localStorage.getItem("prismPinned") === "true");
                    localStorage.setItem("prismPinned", newState);

                    pin.innerHTML = newState ? "📍" : "📌";

                    window.electronAPI.setAlwaysOnTop(newState);
                });

                if (pinned) {
                    window.electronAPI.setAlwaysOnTop(true);
                }
            }

            // HUD Container
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

        // -------------------------------------------------------
        // PRISM Styles
        // -------------------------------------------------------
        mainWindow.webContents.insertCSS(`
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

            #prism-loading {
                position: fixed;
                inset: 0;
                background: #222;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999999;
                opacity: 1;
                transition: opacity 0.3s ease;
            }

            #prism-loading-box {
                text-align: center;
                color: white;
                font-family: Arial, sans-serif;
            }

            #prism-loading-title {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 20px;
            }

            #prism-loading-bar {
                width: 250px;
                height: 6px;
                border-radius: 10px;
                background: linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet, red);
                background-size: 300%;
                animation: prism-load 2s linear infinite;
            }

            @keyframes prism-load {
                0% { background-position: 0% }
                100% { background-position: 300% }
            }

            #prism-pin {
                position: fixed;
                top: 0;
                right: 0;
                width: 40px;
                height: 40px;
                background: rgba(0,0,0,0.5);
                color: white;
                font-size: 20px;
                border: none;
                cursor: pointer;
                border-top-right-radius: ${BORDER_RADIUS}px;
                border-bottom-left-radius: ${BORDER_RADIUS}px;
                z-index: 1000000000 !important;
                backdrop-filter: blur(6px);
            }

            #prism-pin:hover {
                background: rgba(255,255,255,0.15);
            }

            #prism-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 36%;
                height: 5.5%;
                background: rgba(0,0,0,0.35);
                backdrop-filter: blur(8px);
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
                color: white;
                text-shadow: 0 0 4px rgba(0,0,0,0.9);
                z-index: 999999999 !important;
                pointer-events: none;
            }
        `);
    });
}

app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("update-available", () => {
        console.log("PRISM: Update available.");
    });

    autoUpdater.on("update-not-available", () => {
        console.log("PRISM: Already up to date.");
    });

    autoUpdater.on("download-progress", (progressObj) => {
        console.log("PRISM: Downloading...", Math.round(progressObj.percent) + "%");
    });

    autoUpdater.on("update-downloaded", () => {
        console.log("PRISM: Update downloaded. Restarting...");
        autoUpdater.quitAndInstall();
    });

    createWindow();
});
