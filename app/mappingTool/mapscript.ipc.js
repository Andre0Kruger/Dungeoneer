
var initialLoadComplete = false;

ipcRenderer.on("load-map", function (evt, arg) {
    if (!initialLoadComplete) {
        pendingMapLoad = arg;
    } else {
        saveManager.loadMapFromPath(arg);
    }
});
ipcRenderer.on("get-state", (evt, arg) => {
    console.log("Request state")
    serverNotifier.sendState();
});

ipcRenderer.on("intiative-updated",
    function (evt, arg) {
    
        map.updateInitiative(arg);
        serverNotifier.notifyServer("initiative", arg);
    })
ipcRenderer.on('notify-party-array-updated', function (evt, arg) {
    loadParty();
    serverNotifier.notifyServer("party-changed");
});
ipcRenderer.on('notify-effects-changed', function (evt, arg) {
    effectManager.createEffectMenus();
});

ipcRenderer.on("notify-main-reloaded", function () {
    pawns.players.forEach(pawn => raiseConditionsChanged(pawn[0]))

});

ipcRenderer.on('condition-list-changed', function (evt, arg) {

    var pawn = arg.isPlayer ? pawns.players.find(x => x[1] == arg.index)[0]
        : [...document.querySelectorAll(".pawn_numbered")].filter(pw => pw.index_in_main_window == arg.index)[0];

    if (pawn) {
        map.setTokenConditions(pawn, arg.conditions)

    }
});


ipcRenderer.on('monster-health-changed', function (evt, arg) {
    onMonsterHealthChanged(arg);

});

ipcRenderer.on('notify-map-tool-mob-changed', function (evt, arg) {
    var list = JSON.parse(arg);

    list.forEach(param => {
        var pawn = loadedMonstersFromMain.find(x => x.index_in_main_window == param.rowIndex);
        if (!pawn) return;
        pawn.setAttribute("data-mob_size", param.remaining);

        pawn.setAttribute("data-mob_dead_count", parseInt(param.dead));
        refreshMobBackgroundImages(pawn);
        resizePawns();
    });

})

ipcRenderer.on('settings-changed', function (evt, arg) {
    console.log("Settings changed, applying...");

    dataAccess.getSettings(function (data) {
        settings = data.maptool;
        resizeAndDrawGrid();
        onSettingsChanged();
    });
});

ipcRenderer.on('monster-list-cleared', function (evt, arg) {

    loadedMonstersFromMain.forEach(function (element) {
        if (element.getAttribute("data-mob_size") != null)
            return;

        element.index_in_main_window = "";
        element.classList.remove("pawn_numbered");
    });
    loadedMonstersFromMain = [];
});

ipcRenderer.on("client-event", function (evt, arg) {
    console.log(arg);
    if (arg.event == "object-moved") {
        var pawnInfo = arg.data;
        var pawn = document.getElementById(pawnInfo.id);
        var tanslatedPixels = map.pixelsFromGridCoords(pawnInfo.pos.x, pawnInfo.pos.y);

        map.moveObject(pawn, tanslatedPixels, false)
    }
})
ipcRenderer.on("notify-map-tool-monsters-loaded", function (evt, arg) {


    var monsterArray = JSON.parse(arg);

    var counterArray = [];
    var inArray = false, indexInArray = 0;;
    monsterArray.forEach(function (element) {
        for (var i = 0; i < counterArray.length; i++) {
            if (counterArray[i][0] == element.name) {
                inArray = true;
                indexInArray = i;
                break;
            }
        }
        if (inArray) {
            counterArray[indexInArray][1]++;
        } else {
            counterArray.push([element.name, 1]);
        }
        inArray = false;
    });
    counterArray.sort(function (a, b) {
        return b[1] - a[1];
    });


    var color;

    for (var i = monsterArray.length - 1; i >= 0; i--) {
        for (var j = 0; j < counterArray.length; j++) {
            if (counterArray[j][0] == monsterArray[i].name) {
                color = monsterColorPalette[j];
                if (color == null) color = 'rgba(255,255,255,0.45)';
            }
        }
        var newMonster = {
            color: settings.colorTokenBases ? color : "rgba(100,100,100,0)",
            name: monsterArray[i].name,
            size: monsterArray[i].size,
            index_in_main_window: monsterArray[i].index,
            monsterId: monsterArray[i].monsterId,
            isMob: monsterArray[i].isMob == true,
            mobCountDead: 0,
            mobSize: monsterArray[i].mobSize
        }

        pawns.addQueue.push(newMonster)
    }
    document.getElementById("add_pawn_from_tool_toolbar").classList.remove("hidden");


});