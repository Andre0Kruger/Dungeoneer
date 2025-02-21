const dataAccess = require("./js/dataaccess");
const mathyUtil = require("./js/mathyUtil");

const TavernGenerator = require("./js/tavernGenerator");
const tavernGenerator = new TavernGenerator();
const ShopGenerator = require("./js/shopGenerator");
const shopGenerator = new ShopGenerator();
const NpcGenerator = require("./js/npcGenerator");
const npcGenerator = new NpcGenerator();
const ThemeManager = require("./js/themeManager");
var settings;
var marked = require("marked");
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
});
var listOfAllMonsters = [];
var awesompleteSelectionSetMonsters = [];
var encounterSetAwesompletes = [];

const { clipboard } = require("electron");

const { ipcRenderer } = require("electron");

var fs = require("fs");

//UI stuff
//Tree view
function activeTreeviews() {
    var toggler = document.getElementsByClassName("treeview_caret");
    var i;

    for (i = 0; i < toggler.length; i++) {
        toggler[i].addEventListener("click", function () {
            this.parentElement.querySelector(".treeview_nested").classList.toggle("treeview_active");
            this.classList.toggle("treeview_caret-down");
        });
    }
}

function switchNpcGeneratorDetails(index) {
    var buttons = document.getElementsByClassName("creature_generation_buttons")[0].querySelectorAll("button");
    var selectedButton = buttons[index];
    var lastState = selectedButton.getAttribute("toggled");
    if (lastState == "true") {
        //Off
        var otherButton = [...buttons].filter((x) => x != selectedButton)[0];
        otherButton.setAttribute("toggled", true);
    }
    var creatureDetails = document.getElementById("generator_creature_details");
    var creatureNames = document.getElementById("generator_creature_name_details");

    if (creatureNames.classList.contains("hidden")) {
        creatureNames.classList.remove("hidden");
        creatureDetails.classList.add("hidden");
    } else {
        creatureNames.classList.add("hidden");
        creatureDetails.classList.remove("hidden");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    setTab("npc"); //Default to NPC
    populateGenerationSetMenu();
    updateScrollList();
    updateRandomTableNames();
    updateEncounterSetNames();
    dataAccess.getSettings((data) => (settings = data));
    // concatDescriptionArrays();

    document.querySelector("#copyButton").addEventListener("click", function () {
        var npcString = document.querySelector("#generated_npc_name").innerHTML;
        npcString += "\n";
        npcString += document.querySelector("#generated_npc_profession").innerHTML;
        npcString += "\n";
        npcString += document.querySelector("#generated_npc_description").innerHTML;
        clipboard.writeText(npcString);
    });

    dataAccess.getMonsters((mData) => {
        dataAccess.getHomebrewMonsters((hData) => {
            mData.forEach((mon) => listOfAllMonsters.push(mon.name));
            hData.forEach((mon) => listOfAllMonsters.push(mon.name));
            listOfAllMonsters.sort();
        });
    });
    dataAccess.getGeneratorData(function (data) {
        replacementValues = data.replacement_values;
        var creatures = data.generated_creatures;
        var creatureTypes = Object.keys(creatures);
        tavernGenerator.initialize(data, document.querySelector("#taverns_section .genchooser_smaller"), document.querySelector("#taverns_section .genchooser_larger"));
        npcGenerator.initialize(data, document.querySelector("#npc_section .genchooser_smaller"), document.querySelector("#npc_section .genchooser_larger"));
        shopGenerator.initialize(data, document.querySelector("#shops_section .genchooser_smaller"), document.querySelector("#shops_section .genchooser_larger"));
        updateCreatureTypeList(creatureTypes);
        updateCreatureNamesetsList(data.names);
        populateCreatureTypeSelect(creatureTypes);
    });

    document.getElementById("save_creature_set_button").onclick = function (e) {
        dataObj = getJsonObjectFromTreeList();
        var creatureSet = document.getElementById("creature_type_name_input").value.serialize();
        dataAccess.getGeneratorData(function (data) {
            console.log(data.generated_creatures[creatureSet]);
            data.generated_creatures[creatureSet] = dataObj;
            dataAccess.setGeneratorData(data, function (data, err) {
                if (err) {
                    Util.showFailedMessage("Save failed");
                } else {
                    Util.showSuccessMessage("Saved");
                    clearTreeView();
                    document.getElementById("creature_type_name_input").value = "";
                    document.getElementById("delete_creature_set_button").disabled = true;
                }
            });
        });
    };

    document.getElementById("delete_creature_set_button").onclick = function (e) {
        var set = document.getElementById("creature_type_name_input").value;
        if (
            window.dialog.showMessageBoxSync({
                type: "question",
                buttons: ["Ok", "Cancel"],
                title: "Delete nameset?",
                message: "Do you wish to delete the " + set + " creature set?",
            }) == 1
        )
            return;
        dataAccess.getGeneratorData(function (data) {
            delete data.generated_creatures[set.serialize()];
            dataAccess.setGeneratorData(data, function (data, err) {
                if (err) {
                    Util.showFailedMessage("An error occurred");
                } else {
                    Util.showSuccessMessage("Creature set deleted");
                    clearTreeView();
                    document.getElementById("creature_type_name_input").value = "";
                    document.getElementById("delete_creature_set_button").disabled = true;
                }
            });
        });
    };

    document.getElementById("delete_nameset_button").onclick = function (e) {
        var nameSet = document.getElementById("creature_namesets_name_input").value;
        if (
            window.dialog.showMessageBoxSync({
                type: "question",
                buttons: ["Ok", "Cancel"],
                title: "Delete nameset?",
                message: "Do you wish to delete the " + nameSet + " nameset?",
            }) == 1
        )
            return;
        dataAccess.getGeneratorData(function (data) {
            delete data.names[nameSet.serialize()];
            dataAccess.setGeneratorData(data, function (data, err) {
                if (err) {
                    Util.showFailedMessage("An error occurred");
                } else {
                    Util.showSuccessMessage("Nameset deleted");
                    clearTreeView();
                    document.getElementById("creature_namesets_name_input").value = "";
                    document.getElementById("delete_nameset_button").disabled = true;
                }
            });
        });
    };

    document.getElementById("save_nameset_button").onclick = function (e) {
        dataObj = getJsonObjectFromTreeList();
        if (dataObj == null) throw "Dataobject null";

        var nameSet = document.getElementById("creature_namesets_name_input").value.serialize();

        dataAccess.getGeneratorData(function (data) {
            data.names[nameSet] = dataObj;
            dataAccess.setGeneratorData(data, function (data, err) {
                if (err) {
                    Util.showFailedMessage("Save failed");
                } else {
                    Util.showSuccessMessage("Saved");
                    clearTreeView();
                    document.getElementById("creature_namesets_name_input").value = "";
                    document.getElementById("delete_nameset_button").disabled = true;
                }
            });
        });

        document.getElementById("save_nameset_button").disabled = true;
    };

    function clearTreeView() {
        var domTree = document.getElementById("creature_navigator");
        while (domTree.firstChild) domTree.removeChild(domTree.firstChild);
        document.getElementById("currently_editing_navigator").innerHTML = "";
    }

    function getJsonObjectFromTreeList() {
        var domTree = document.getElementById("creature_navigator").firstChild;
        var dataObj = {};
        nextLevel(dataObj, domTree, "");
        return dataObj;
        function nextLevel(obj, dom, lastAttribute) {
            if (dom.childNodes == null) return;
            if (![...dom.childNodes].find((x) => x.classList.contains("treeview_attribute"))) {
                var attributeElement = [...dom.childNodes].find((x) => x.classList && x.classList.contains("treeview_caret"));
                if (!attributeElement) {
                    for (var i = 0; i < dom.childNodes.length; i++) nextLevel(obj, dom.childNodes[i], lastAttribute);
                    return;
                }
                var attr = attributeElement.innerHTML;
                if (!obj[lastAttribute] && lastAttribute) obj[lastAttribute] = {};
                nextLevel(
                    lastAttribute ? obj[lastAttribute] : obj,
                    [...dom.childNodes].find((x) => x.classList.contains("treeview_nested")),
                    attr,
                );
            } else {
                var attrList = [...dom.childNodes].filter((x) => x.classList.contains("treeview_attribute")).map((x) => x.firstChild.innerHTML);
                obj[lastAttribute] = attrList ? attrList : [];
            }
        }
    }

    function populateCreatureTypeSelect(creatureTypes) {
        var creatureNameSelect = document.getElementById("choose_type_generated_creature");
        creatureTypes.forEach((cretType) => {
            var newOption = document.createElement("option");
            newOption.setAttribute("value", cretType);
            var unSerialized = unSerialize(cretType);
            console.log(unSerialized);
            newOption.innerHTML = unSerialized.substring(0, 1).toUpperCase() + unSerialized.substring(1).toLowerCase();
            creatureNameSelect.appendChild(newOption);
        });
    }

    function updateCreatureNamesetsList(names) {
        console.log(Object.keys(names));
        var input = document.getElementById("creature_namesets_name_input");
        new Awesomplete(input, {
            list: Object.keys(names),
            autoFirst: true,
            minChars: 0,
            maxItems: 120,
        });
        input.addEventListener("awesomplete-selectcomplete", function (e) {
            dataAccess.getGeneratorData((data) => {
                var creature = data.names[e.target.value];
                document.getElementById("currently_editing_navigator").innerText = e.target.value + " names" + (creature == null ? " (new)" : "");
                if (!creature) {
                    creature = { male: [""], female: [""], lastnames: [""] };
                } else {
                    document.getElementById("delete_nameset_button").disabled = false;
                }
                createCreatureTreeList(creature);
                document.getElementById("save_nameset_button").disabled = false;
            });
        });
    }

    function updateCreatureTypeList(creatureTypes) {
        var input = document.getElementById("creature_type_name_input");
        new Awesomplete(input, {
            list: creatureTypes,
            autoFirst: true,
            minChars: 0,
            maxItems: 120,
        });
        input.addEventListener("keydown", function (e) {
            if (e.keyCode == 13) populateCreatureTreeView(e);
        });
        input.addEventListener("awesomplete-selectcomplete", populateCreatureTreeView);
        function populateCreatureTreeView(e) {
            dataAccess.getGeneratorData((data) => {
                var creature = data.generated_creatures[e.target.value];
                document.getElementById("currently_editing_navigator").innerText = e.target.value + (creature == null ? " (new)" : "");
                if (creature == null) {
                    creature = {
                        professions: {
                            common: [""],
                            uncommon: [""],
                            rare: [""],
                        },
                        traits: [""],
                        hooks: [""],
                        appearance: {
                            face_aesthetics: [""],
                            face_shape: [""],
                            build: [""],
                        },
                    };
                } else {
                    document.getElementById("delete_creature_set_button").disabled = false;
                }
                document.getElementById("save_creature_set_button").disabled = false;
                createCreatureTreeList(creature);
            });
        }
    }
});

var editingListAttribute = false;
function createCreatureTreeList(object) {
    var cont = document.getElementById("creature_navigator");
    while (cont.firstChild) cont.removeChild(cont.firstChild);

    var list = document.createElement("ul");
    list.classList = "treeview_list";
    iterate(object, list, 10);

    cont.appendChild(list);
    cont.classList.remove("hidden");
    activeTreeviews();
    document.getElementById("save_nameset_button").disabled = false;

    function iterate(arr, parentElement, infiniteLoopGuard) {
        if (infiniteLoopGuard == 0) return;

        Object.keys(arr).forEach(function (key) {
            var li = document.createElement("li");
            if (typeof arr[key] == "object") {
                var caret = document.createElement("span");

                li.appendChild(caret);
                caret.classList = "treeview_caret";
                caret.innerText = unSerialize(key);
                var ul = document.createElement("ul");
                ul.classList = "treeview_nested";

                li.appendChild(ul);
                parentElement.appendChild(li);
                return iterate(arr[key], ul, infiniteLoopGuard - 1);
            }
            //attribute
            parentElement.appendChild(li);
            parentElement.classList.add("attribute_list");
            parentElement.addEventListener("dblclick", addRowToAttListHandler);
            li.classList.add("treeview_attribute");
            createParagraph(arr[key], li);
        });
    }
    function addRowToAttListHandler(evt) {
        console.log("Editing: " + editingListAttribute);
        if (editingListAttribute) return;
        if (evt.target.tagName == "P") return;
        var parentList = evt.target.closest(".treeview_nested ");
        addRowToAttList(parentList);
    }

    function addRowToAttList(parentList) {
        console.log("Create new row on enter");
        var li = document.createElement("li");
        li.classList = "treeview_attribute";
        parentList.appendChild(li);
        createEditParagraph("", li);
        li.scrollIntoView();
    }
    function createParagraph(text, li) {
        if (text == null || text == "") {
            if (li && li.parentNode) li.parentNode.removeChild(li);
            return;
        }
        var p = document.createElement("p");
        p.innerText = text;
        p.ondblclick = editListAttribute;
        li.appendChild(p);
        return p;
    }

    function createEditParagraph(text, li) {
        var input = document.createElement("input");
        input.value = text;
        input.setAttribute("data-old_value", text);
        li.appendChild(input);
        input.select();
        input.addEventListener("keydown", leaveOnEnterOrEsc);
        editingListAttribute = true;
        input.addEventListener("blur", stopEditing);
        function leaveOnEnterOrEsc(evt) {
            if (evt.keyCode == 13 || evt.keyCode == 27) {
                //esc
                if (evt.keyCode == 27) {
                    evt.target.value = evt.target.getAttribute("data-old_value");
                    //create new line straight away if enter
                } else if (evt.keyCode == 13) {
                    if (evt.target.value != "") {
                        var parentList = input.closest(".treeview_nested");

                        window.setTimeout(() => {
                            editingListAttribute = false;

                            addRowToAttList(parentList);
                        }, 100);
                    }
                }
                document.activeElement.blur();
            }
        }

        function stopEditing(evt) {
            window.setTimeout(() => {
                if (evt.target != document.activeElement) doStopEditing(evt);
            }, 50);

            function doStopEditing(evt) {
                editingListAttribute = false;
                var oldText = evt.target.getAttribute("data-old_value");

                var text = evt.target.value;
                var parent = evt.target.parentNode;
                if (parent.contains(evt.target)) parent.removeChild(evt.target);
                createParagraph(text, parent);
                if (oldText != text) parent.classList.add("new_treeview_attribute");
                //Sort alphabetically
                var container = parent.parentNode;
                if (!container) return;
                var nodeList = [...container.childNodes];
                while (nodeList.firstChild) nodeList.removeChild(nodeList.firstChild);
                nodeList.sort(function (a, b) {
                    var first = a.querySelector("p").innerHTML.toUpperCase();
                    var second = b.querySelector("p").innerHTML.toUpperCase();
                    if (first < second) return 1;
                    if (second < first) return -1;
                    return 0;
                });
                while (nodeList.length > 0) container.appendChild(nodeList.pop());
            }
        }
    }

    function editListAttribute(event) {
        editingListAttribute = true;
        var para = event.target.parentNode.getElementsByTagName("p")[0];
        createEditParagraph(para.innerHTML, para.parentNode);
        para.parentNode.removeChild(para);
    }
}

var randomTableNames;
function updateRandomTableNames() {
    var input = document.getElementById("random_table_name_input");
    input.addEventListener("keydown", function (evt) {
        if (evt.keyCode == 13) {
            populateRandomTable();
        }
    });

    var encDumpInput = document.getElementById("encounter_set_dump");
    encDumpInput.addEventListener("paste", dumpCreateEncounterSet);
    var tableDumpInput = document.getElementById("random_table_dump");
    tableDumpInput.addEventListener("paste", dumpCreateTable);
    dataAccess.getRandomTables(function (data) {
        var data = data.tables;
        randomTableNames = [...Object.keys(data)];
        for (var i = 0; i < randomTableNames.length; i++) {
            randomTableNames[i] = unSerialize(randomTableNames[i]);
        }
        var aws = new Awesomplete(input, {
            list: randomTableNames,
            autoFirst: true,
            minChars: 0,
            maxItems: 120,
        });
        input.addEventListener("awesomplete-selectcomplete", function (e) {
            populateRandomTable();
        });
    });
}

var encounterSetAwesomplete;
function updateEncounterSetNames() {
    var input = document.getElementById("encounter_set_name_input");
    input.addEventListener("keydown", function (evt) {
        if (evt.keyCode == 13) {
            loadEncounterSet();
        }
    });
    var tableDumpInput = document.getElementById("encounter_set_dump");
    tableDumpInput.addEventListener("paste", dumpCreateEncounterSet);

    dataAccess.getRandomTables(function (data) {
        var data = data.encounter_sets;
        if (data == null) return;
        var encounterSetNames = [...Object.keys(data)];

        for (var i = 0; i < encounterSetNames.length; i++) {
            encounterSetNames[i] = unSerialize(encounterSetNames[i]);
        }
        encounterSetAwesomplete = new Awesomplete(input, {
            list: encounterSetNames,
            autoFirst: true,
            minChars: 0,
        });
        input.addEventListener("awesomplete-selectcomplete", function (e) {
            loadEncounterSet();
        });
    });
}

/* #region encounter sets */

function loadEncounterSet() {
    var input = document.getElementById("encounter_set_name_input");
    if (input.value == "") return;
    dataAccess.getRandomTables(function (data) {
        var data = data.encounter_sets ? data.encounter_sets : [];
        var selectedSet = data[serialize(input.value)];
        createEncourSetTableFromDataSet(selectedSet);
    });
}

function createEncourSetTableFromDataSet(dataset) {
    var tableContainer = document.getElementById("customize_table");
    randomizeTable = null;
    clearRandomTableContainer();

    var creatureArray = [];

    if (dataset == null) {
        creatureArray.push("");
        document.getElementById("delete_encounter_set_button").classList.add("hidden");
    } else {
        document.getElementById("delete_encounter_set_button").classList.remove("hidden");
        for (var i = 0; i < dataset.length; i++) {
            var curr = dataset[i];
            creatureArray.push(curr);
        }
    }
    randomizeTable = generateEncounterTable({
        creatures: creatureArray,
    });
    tableContainer.appendChild(randomizeTable);

    document.getElementById("save_encounter_set_button").classList.remove("hidden");
    document.getElementById("add_encounter_set_row").classList.remove("hidden");

    if (dataset != null) {
        addEncounterSetRow("").getElementsByClassName("encounter_set_add_creature")[0].focus();
    } else {
        document.getElementsByClassName("encounter_set_add_creature")[0].focus();
    }
    refreshMonsterListInputs();
}

function generateEncounterTable(obj) {
    if (!obj || !obj.creatures) obj = { creatures: [] };
    var newTable = document.createElement("table");

    var currentHeader = document.createElement("thead");
    var currentRow = document.createElement("tr");
    currentHeader.appendChild(currentRow);
    newTable.appendChild(currentHeader);
    newNode = document.createElement("th");
    newNode.innerText = "Creatures";
    currentRow.appendChild(newNode);

    currentHeader = document.createElement("tbody");
    for (var i = 0; i < obj.creatures.length; i++) {
        currentHeader.appendChild(createEnconterSetTableRow(obj.creatures[i]));
    }
    newTable.appendChild(currentHeader);
    return newTable;
}

function createEnconterSetTableRow(value) {
    var newNode, newInput;
    currentRow = document.createElement("tr");

    newInput = document.createElement("input");
    newInput.value = value;
    newInput.classList = "encounter_set_add_creature";
    newNode = document.createElement("td");
    newNode.appendChild(newInput);
    currentRow.appendChild(newNode);

    encounterSetAwesompletes.push(
        new Awesomplete(newInput, {
            list: awesompleteSelectionSetMonsters,
            autoFirst: true,
            minChars: 1,
            maxItems: 50,
        }),
    );
    newInput.addEventListener("awesomplete-selectcomplete", (e) => {
        var inputs = [...document.getElementsByClassName("encounter_set_add_creature")];
        var emptyInput;
        inputs.forEach((inp) => {
            if (inp.value == "") emptyInput = inp;
        });
        if (!emptyInput) emptyInput = addEncounterSetRow("").getElementsByClassName("encounter_set_add_creature")[0];
        refreshMonsterListInputs();
        emptyInput.focus();
    });
    return currentRow;
}

function refreshMonsterListInputs() {
    var allInputValues = [];
    encounterSetAwesompletes.forEach((awes) => {
        if (allInputValues.indexOf(awes.input.value) < 0) allInputValues.push(awes.input.value);
    });

    encounterSetAwesompletes.forEach((awes) => {
        allInputValues.forEach((value) => {
            if (awes._list.indexOf(value) >= 0) {
                awes._list.splice(awes._list.indexOf(value), 1);
            }
        });
    });
}

function addEncounterSetRow(rowData) {
    if (randomizeTable == null) return;
    var row = createEnconterSetTableRow(rowData ? rowData : "");
    randomizeTable.getElementsByTagName("tbody")[0].appendChild(row);
    return row;
}

function dumpCreateEncounterSet(evt) {
    var tableDumpInput = document.getElementById("encounter_set_dump");
    window.setTimeout(function () {
        var lines = tableDumpInput.value.split("\n");
        createEncourSetTableFromDataSet(lines);
    }, 1);
}

function deleteEncounterSet() {
    var input = document.getElementById("encounter_set_name_input");
    var encounterSetName = serialize(input.value);

    dataAccess.getRandomTables(function (data) {
        var obj = data;
        data = obj.encounter_sets;

        if (data[encounterSetName] == null) return;
        var response = window.dialog.showMessageBoxSync({
            type: "question",
            buttons: ["Ok", "Cancel"],
            title: "Delete table?",
            message: "Do you wish to delete encounter set " + input.value + " ?",
        });
        if (response != 0) return;
        delete data[encounterSetName];
        encounterSetName = unSerialize(encounterSetName);
        obj.encounter_sets = data;
        dataAccess.setRandomTables(obj, function (data) {
            if (encounterSetAwesomplete._list.indexOf(encounterSetName) > 0) encounterSetAwesomplete._list.splice(encounterSetAwesomplete._list.indexOf(encounterSetName), 1);
            clearRandomTableContainer();
            document.getElementById("save_encounter_set_button").classList.add("hidden");
            document.getElementById("delete_encounter_set_button").classList.add("hidden");
            document.getElementById("add_encounter_set_row").classList.add("hidden");
            input.value = "";
        });
    });
}

function saveEncounterSet() {
    var encounterSetName = document.getElementById("encounter_set_name_input").value;
    if (encounterSetName == "") {
        window.dialog.showMessageBoxSync({
            type: "info",
            buttons: ["Ok"],
            title: "Unable to save table",
            message: "Table name required",
        });
        return;
    }

    var creatureList = [];
    encounterSetAwesompletes.forEach((awes) => {
        var cret = awes.input.value;
        if (cret == "") return;
        var doesExist = listOfAllMonsters.indexOf(cret) >= 0;
        if (doesExist) {
            creatureList.push(cret);
        }
    });
    dataAccess.getRandomTables((data) => {
        data.encounter_sets[serialize(encounterSetName)] = creatureList;
        dataAccess.setRandomTables(data, (resultData, err) => {
            if (encounterSetAwesomplete._list.indexOf(encounterSetName) < 0) encounterSetAwesomplete._list.push(encounterSetName);
            if (err) {
                Util.showFailedMessage("Save failed");
                return;
            }
            document.getElementById("delete_encounter_set_button").classList.remove("hidden");

            Util.showSuccessMessage("Saved");
            document.getElementById("encounter_set_name_input").value = "";
            clearRandomTableContainer();
        });
    });
}
/* #endregion encounter sets */
/* #region random tables */

function dumpCreateTable(evt) {
    var tableDumpInput = document.getElementById("random_table_dump");
    window.setTimeout(function () {
        processDump();
    }, 1);

    function processDump() {
        var input = tableDumpInput.value;
        if (input == "") return;
        var allLines = input.split("\n");
        var baseProbability = 1 / allLines.length;
        var currentLine;
        var obj = [];

        for (var i = 0; i < allLines.length; i++) {
            currentLine = allLines[i].split("\t");
            if (currentLine.length > 1) {
                obj.push({
                    title: currentLine[0],
                    probability: currentLine[2] ? createProbabilityFromTableString(currentLine[2], baseProbability) : baseProbability,
                    content: currentLine[1],
                    active: currentLine[3] ? currentLine[3] : "y",
                });
            } else {
                obj.push({
                    title: "",
                    probability: baseProbability,
                    content: allLines[i],
                    active: "y",
                });
            }
        }
        createRandomizeTableFromSet(obj);

        function createProbabilityFromTableString(probString, fallback) {
            var values = probString.split(/[+|-]+/);
            var finalValue;

            if (values.length > 1) {
                var higherNumber = Math.max(parseInt(values[0]), parseInt(values[1]));
                var lowerNumber = Math.min(parseInt(values[0]), parseInt(values[1]));

                finalValue = higherNumber - lowerNumber;
                if (isNaN(finalValue)) return fallback;
                return finalValue;
            }
            finalValue = parseInt(probString);
            if (isNaN(finalValue)) return fallback;
            return finalValue;
        }
    }
}
var randomizeTable;
function populateRandomTable() {
    var input = document.getElementById("random_table_name_input");
    if (input.value == "") {
        document.getElementById("delete_table_button").classList.add("hidden");
        return;
    }

    dataAccess.getRandomTables(function (data) {
        var data = data.tables;
        var selectedSet = data != null ? data[serialize(input.value)] : null;
        createRandomizeTableFromSet(selectedSet);
    });
}

function generateRandomTable(jsonObj) {
    var expectedLength = Object.values(jsonObj)[0].length;
    for (var i = 1; i < Object.values(jsonObj).length; i++) {
        if (Object.values(jsonObj)[i].length != expectedLength) {
            console.log("Cannot create table from arrays of unequal length.");
            return;
        }
    }
    var newTable = document.createElement("table");
    var newNode, newInput;
    var currentHeader = document.createElement("thead");
    var currentRow = document.createElement("tr");
    var columnCount = 0;
    currentHeader.appendChild(currentRow);
    newTable.appendChild(currentHeader);
    for (arr in jsonObj) {
        columnCount++;
        newNode = document.createElement("th");
        newNode.innerText = unSerialize(arr);
        currentRow.appendChild(newNode);
    }
    currentHeader = document.createElement("tbody");
    for (var i = 0; i < expectedLength; i++) {
        currentRow = document.createElement("tr");
        currentHeader.appendChild(currentRow);
        for (var j = 0; j < columnCount; j++) {
            newNode = document.createElement("td");
            if (j == 3) {
                newInput = document.createElement("input");
                newInput.value = Object.values(jsonObj)[j][i];
                newInput.classList = "random_table_followup_input";
                newNode.appendChild(newInput);
                createTableNameAwesomeplete(newInput);
            } else {
                newNode.innerText = Object.values(jsonObj)[j][i];
                newNode.setAttribute("contenteditable", true);
            }

            currentRow.appendChild(newNode);
        }
        currentRow.appendChild(createDeleteButton());
    }
    newTable.appendChild(currentHeader);
    return newTable;

    function createDeleteButton() {
        var btn = document.createElement("button");
        btn.classList = "remove_button";
        btn.onclick = function (evt) {
            var parent = evt.target.closest("tr");
            parent.parentNode.removeChild(parent);
        };
        return btn;
    }
}
function createTableNameAwesomeplete(newInput) {
    new Awesomplete(newInput, {
        list: randomTableNames,
        autoFirst: true,
        minChars: 0,
        maxItems: 50,
    });
}

function deleteRandomTable() {
    console.log("to");
    var input = document.getElementById("random_table_name_input");
    var tblName = serialize(input.value);
    dataAccess.getRandomTables(function (data) {
        var obj = data;
        data = obj.tables;

        if (!data || data[tblName] == null) return;
        var response = window.dialog.showMessageBoxSync({
            type: "question",
            buttons: ["Ok", "Cancel"],
            title: "Delete table?",
            message: "Do you wish to delete table " + input.value + " ?",
        });

        if (response != 0) return;

        delete data[tblName];

        obj.tables = data;
        dataAccess.setRandomTables(obj, function (data) {
            if (randomTableNames.indexOf(input.value) < 0) {
                randomTableNames.splice(randomTableNames.indexOf(input.value), 1);
            }
            clearRandomTableContainer();
            document.getElementById("save_table_button").classList.add("hidden");
            document.getElementById("delete_table_button").classList.add("hidden");
            document.getElementById("addTableRowButton").classList.add("hidden");
        });
    });
}

function saveRandomTable() {
    var input = document.getElementById("random_table_name_input");
    if (input.value == "") {
        window.dialog.showMessageBoxSync({
            type: "info",
            buttons: ["Ok"],
            title: "Unable to save table",
            message: "Table name required",
        });
        return;
    }
    var tblBody = randomizeTable.getElementsByTagName("tbody")[0];
    var rows = tblBody.querySelectorAll("tr");
    var arr = [];
    for (var i = 0; i < rows.length; i++) {
        var obj = {};
        var children = rows[i].getElementsByTagName("td");
        if (children[0].innerHTML == "" && children[1].innerHTML == "" && children[3].getElementsByTagName("input")[0].value == "") {
            continue;
        }
        obj.title = children[0].innerHTML;
        obj.content = children[1].innerHTML;
        obj.probability = isNaN(parseFloat(children[2].innerHTML)) ? 1 : parseFloat(children[2].innerHTML);
        obj.followup_table = children[3].getElementsByTagName("input")[0].value ? serialize(children[3].getElementsByTagName("input")[0].value) : "";
        arr.push(obj);
    }

    var tblName = serialize(input.value);
    dataAccess.getRandomTables(function (data) {
        var obj = data;
        data = obj.tables;
        if (data == null) data = {};
        data[tblName] = arr;
        obj.tables = data;

        dataAccess.setRandomTables(obj, function (data, err) {
            if (err) {
                Util.showFailedMessage("Save failed");
                return;
            }
            if (randomTableNames.indexOf(input.value) < 0) {
                randomTableNames.push(input.value);
            }
            document.getElementById("delete_table_button").classList.remove("hidden");
            console.log("saved");
            Util.showSuccessMessage("Saved");
        });
    });
}

function clearRandomTableContainer() {
    var tableContainer = document.getElementById("customize_table");
    randomizeTable = null;
    while (tableContainer.firstChild) {
        tableContainer.removeChild(tableContainer.firstChild);
    }
    awesompleteSelectionSetMonsters = [...listOfAllMonsters];
    encounterSetAwesompletes = [];
}

function createRandomizeTableFromSet(dataset) {
    var tableContainer = document.getElementById("customize_table");
    randomizeTable = null;
    clearRandomTableContainer();

    var titleArray = [];
    var contentArray = [];
    var probabilityArray = [];
    var activeArray = [];
    var rollAgainArray = [];
    if (dataset == null) {
        titleArray.push("");
        contentArray.push("");
        probabilityArray.push("");
        activeArray.push("");
        rollAgainArray.push("");
        document.getElementById("delete_table_button").classList.add("hidden");
    } else {
        document.getElementById("delete_table_button").classList.remove("hidden");
        for (var i = 0; i < dataset.length; i++) {
            var curr = dataset[i];
            titleArray.push(curr.title ? curr.title : "");
            contentArray.push(curr.content ? curr.content : "");
            probabilityArray.push(curr.probability ? curr.probability : "");
            activeArray.push(curr.active ? curr.active : "");
            rollAgainArray.push(curr.followup_table ? unSerialize(curr.followup_table) : "");
        }
    }
    randomizeTable = generateRandomTable({
        Title: titleArray,
        Content: contentArray,
        Percentage: probabilityArray,
        Roll_again_on: rollAgainArray,
    });
    tableContainer.appendChild(randomizeTable);

    document.getElementById("save_table_button").classList.remove("hidden");
    document.getElementById("addTableRowButton").classList.remove("hidden");
}

function addRandomTableRow() {
    if (randomizeTable == null) return;
    var row = document.createElement("tr");
    for (var i = 0; i < 3; i++) {
        var td = document.createElement("td");
        td.setAttribute("contenteditable", "true");

        row.appendChild(td);
    }
    var td = document.createElement("td");
    td.setAttribute("contenteditable", "true");
    var tdInput = document.createElement("input");
    tdInput.classList = "random_table_followup_input";
    td.appendChild(tdInput);
    createTableNameAwesomeplete(tdInput);

    row.appendChild(td);
    randomizeTable.getElementsByTagName("tbody")[0].appendChild(row);
}

function d(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function unSerialize(string) {
    return string.replace(/_/g, " ");
}

function serialize(string) {
    return string.replace(/ /g, "_");
}

function openCustomizationTab(containerName, button) {
    [...document.querySelectorAll(".generator_customization_section, .explanation_text_customize_generator")].forEach((ele) => ele.classList.add("hidden"));
    document.getElementById(button.getAttribute("data-explanation_text")).classList.remove("hidden");
    document.getElementById(containerName).classList.remove("hidden");
    normalizeGeneratorPageStates();

    function normalizeGeneratorPageStates() {
        clearRandomTableContainer();
        document.getElementById("creature_navigator").classList.add("hidden");
        document.getElementById("currently_editing_navigator").innerHTML = "";
    }
}

function setTab(x) {
    var tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("toggle_button_toggled");
        var currentSection = document.querySelector("#" + tabs[i].getAttribute("data-section_id") + "_section");
        currentSection.classList.add("hidden");
    }

    document.getElementById(x).classList.add("toggle_button_toggled");
    document.querySelector("#" + x + "_section").classList.remove("hidden");
}

function populateGenerationSetMenu() {
    dataAccess.getGeneratorData(function (data) {
        var newOption, setName;
        var setDropDownChooser = document.querySelector("#choose_nameset");
        for (var i = 0; i < Object.keys(Object.values(data)[0]).length; i++) {
            setName = Object.keys(Object.values(data)[0])[i];
            newOption = document.createElement("option");
            newOption.setAttribute("value", setName);
            newOption.innerHTML = setName.charAt(0).toUpperCase() + setName.slice(1);
            setDropDownChooser.appendChild(newOption);
        }
    });
}

function getEmbeddable(element, callback) {
    dataAccess.readFile(
        window.api.path.join(ThemeManager.BASE_CSS_PATH, "generators.css"),
        (styleCont) => {
            console.log(styleCont);
            dataAccess.readFile(
                window.api.path.join(ThemeManager.BASE_CSS_PATH, "theme.css"),
                (rootCont) => {
                    dataAccess.readFile(
                        window.api.path.join(ThemeManager.BASE_CSS_PATH, "common.css"),
                        (commonCss) => {
                            dataAccess.readFile(
                                window.api.path.join(ThemeManager.BASE_CSS_PATH, "quill", "snow.css"),
                                (snowCss) => {
                                    styleCont = rootCont + commonCss + styleCont + snowCss;
                                    callback(`<link rel = 'stylesheet' url <div>${element.outerHTML} <style>${styleCont}</style> </div>`);
                                },
                                false,
                            );
                        },
                        false,
                    );
                },
                false,
            );
        },
        false,
    );
}

const SPELL_DESCRIPTION_MAX = 700;
function updateScrollList() {
    dataAccess.getSpells(function (data) {
        var scrollItems = [];
        var newItem, rarity, saveDc, attackBonus;
        data.forEach(function (element) {
            newItem = {};
            rarity = constants.scrollLevels[0][parseInt(element.level)];
            saveDc = constants.scrollLevels[1][parseInt(element.level)];
            attackBonus = constants.scrollLevels[2][parseInt(element.level)];
            newItem.type = "Scroll";
            newItem.rarity = rarity;
            newItem.name = "Scroll of " + element.name;
            if (element.description.length > SPELL_DESCRIPTION_MAX) {
                element.description = element.description.slice(0, SPELL_DESCRIPTION_MAX) + "...";
            }
            newItem.description = "**" + (element.classes != null ? joinAndCapitalize(element.classes) : "") + " scroll, " + rarity + "**" + "\n" + "Save DC " + saveDc + ". Attack bonus " + attackBonus + "." + "\n" + element.description;
            newItem.source = "SRD";
            scrollItems.push(newItem);
        });
        dataAccess.setScrolls(scrollItems);
    });
}
function joinAndCapitalize(array, separator) {
    for (var i = 0; i < array.length; i++) {
        array[i] = array[i].substring(0, 1).toUpperCase() + array[i].substring(1);
    }
    if (!separator) separator = ", ";
    return array.join(separator);
}
