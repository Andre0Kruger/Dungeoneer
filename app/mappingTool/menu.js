const Modals = require("../js/modals");
class Menu {
    static initialize() {
        document.getElementById("add_things_button").onclick = function (e) {
            ipcRenderer.send("open-add-maptool-stuff-window");
        };

        document.getElementById("fog_of_war_hue_selector").onchange = function (event) {
            settings.fogOfWarHue = event.target.value;
            saveSettings();
            refreshFogOfWar();
            if (!settings.transparentWindow) document.body.style.backgroundColor = event.target.value;
        };

        document.querySelector("#vision_button").onclick = showLightSourceTooltip;
        document.querySelector("#conditions_button").onclick = showConditionsMenu;
        document.getElementById("filter_tool").onchange = onBackgroundFilterSelected;
        document.getElementById("foreground_size_slider").oninput = function (event) {
            resizeForeground(event.target.value);
        };

        document.getElementById("background_size_slider").oninput = function (event) {
            resizeBackground(event.target.value);
        };
        document.getElementById("overlay_size_slider").oninput = function (event) {
            resizeOverlay(event.target.value);
        };
        document.getElementById("foreground_button").onclick = getForegroundFromFile;
        document.getElementById("foreground_menu_button").onclick = getForegroundFromFile;
        document.getElementById("clear_background_button").onclick = function (e) {
            setMapBackground(null);
        };
        document.getElementById("overlay_menu_button").onclick = getOverlayFromFile;
        document.getElementById("background_menu_button").onclick = getBackgroundFromFile;
        document.getElementById("background_button").onclick = getBackgroundFromFile;
        document.getElementById("overlay_button").onclick = getOverlayFromFile;
        document.getElementById("clear_overlay_button").onclick = () => setMapOverlay(null);
        document.getElementById("save_map_button").onclick = function (e) {
            saveManager.saveCurrentMap();
        };
        document.getElementById("load_map_button").onclick = function (e) {
            saveManager.loadMapDialog();
        };

        document.querySelector("#backdrop_window_button").onclick = function (e) {
            ipcRenderer.send("open-maptool-backdrop-window");
        };
        document.querySelector("#clear_map_edge_button").onclick = function (e) {
            settings.map_edge_style = null;
            document.querySelector(".maptool_body").style.backgroundImage = "none";
            saveSettings();
            serverNotifier.notifyServer("map_edge", serverNotifier.getMapEdgeState());
        };
        document.querySelector("#map_edge_button").onclick = function (e) {
            var imgPath = getMapImageFromDialog();

            document.querySelector(".maptool_body").style.backgroundImage = "url('" + imgPath + "')";
            settings.map_edge_style = imgPath;
            saveSettings();
            serverNotifier.notifyServer("map_edge", serverNotifier.getMapEdgeState());
        };

        document.getElementById("open_server_button").onclick = (e) => {
            saveSettings();
            ipcRenderer.send("open-server-window");
        };

        document.getElementById("token_scale_button").onclick = (e) => {
            var firstPawn = selectedPawns[0];
            var initValue = selectedPawns.length == 1 ? pawnManager.getScale(firstPawn) : 1;

            Modals.minifiedPrompt(
                { clientX: firstPawn.offsetLeft, clientY: firstPawn.offsetTop },
                {
                    title: "Set scale",
                    id: "prompt-scale",
                    callbackOnUpdate: true,
                    initialValue: initValue,
                    type: "number",
                },
                (scale) => {
                    if (!scale) return;
                    selectedPawns.forEach((pawn) => {
                        pawnManager.setScale(pawn, scale);
                    });
                },
            );
        };
    }
}

module.exports = Menu;
