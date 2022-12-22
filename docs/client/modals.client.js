const ClientModals = (function () {
    function modalBase(titleText, callback) {
        var title = document.createElement("h1");
        title.innerHTML = titleText;

        var modal = document.createElement("div");
        if (titleText) modal.appendChild(title);
        modal.classList = "modal";
        var closeBtn = document.createElement("button");
        closeBtn.classList = "close_x_button";
        closeBtn.onclick = function (e) {
            modal.close();
        };

        document.addEventListener("keydown", closeOnKeyDown);
        function closeOnKeyDown(e) {
            if (e.key != "Escape") return;
            modal.close();
        }
        modal.appendChild(closeBtn);
        var parent = Util.ele("div", "modal_container");
        modal.close = (callbackHandled) => {
            parent?.parentNode?.removeChild(parent);
            document.removeEventListener("keydown", closeOnKeyDown, false);
            if (!callbackHandled) callback(null);
        };

        parent.appendChild(modal);
        return { modal: modal, parent: parent };
    }
    function multiInputPrompt(title, inputs, callback) {
        var modalCreate = modalBase(title, () => {
            callback(null);
        });
        var modal = modalCreate.modal;
        modal.classList.add("modal_prompt");
        modal.canConfirm = () => {
            var inputDom = modal.querySelectorAll(".modal_input");
            for (var i = 0; i < inputDom.length; i++) {
                var inp = inputDom[i];
                if (inp.getAttribute("data-required") == "true" && !inp.value) {
                    return false;
                }
            }
            return true;
        };
        var col = Util.ele("div", "column");
        inputs.forEach((inputType) => {
            var inputRow = createPromptInput(inputType.label, modal, confirm, "row", inputType.required, inputType.id);
            col.appendChild(inputRow);
        });
        modal.appendChild(col);
        var btn = Util.ele("button", "button_wide button_style", "Ok");
        var btnRow = Util.ele("div", "row flex_end base_margin");
        btnRow.appendChild(btn);
        btn.onclick = (e) => {
            if (!modal.canConfirm()) return;
            confirm();
        };
        modal.appendChild(btnRow);
        document.body.appendChild(modalCreate.parent);
        modal.querySelector("input").focus();

        function confirm() {
            var inputDom = [...modal.querySelectorAll(".modal_input")];
            var returnValue = inputDom.map((x) => {
                return {
                    label: x.getAttribute("data-property"),
                    id: x.getAttribute("data-id"),
                    value: x.value,
                };
            });
            modal.close(true);
            callback(returnValue);
        }
    }

    function prompt(title, label, callback, options) {
        var modalCreate = modalBase(title, () => {
            callback(null);
        });
        var modal = modalCreate.modal;
        var row = createPromptInput(label, modal, callback, options);
        modal.classList.add("modal_prompt");
        modal.appendChild(row);
        var btn = Util.ele("button", "button_wide button_style", "Ok");
        var btnRow = Util.ele("div", "row flex_end base_margin modal_ok_row");
        btnRow.appendChild(btn);
        btn.onclick = (e) => {
            callback(modal.querySelector(".modal_input").value);
            modal.close();
        };
        modal.appendChild(btnRow);
        document.body.appendChild(modalCreate.parent);
        modal.querySelector("input").focus();
        return modal;
    }

    function createPromptInput(label, modal, callback, options) {
        var input = Util.ele("input", "modal_input");
        if (options && options.required) input.setAttribute("data-required", true);
        if (options && options.placeholder) input.setAttribute("placeholder", options.placeholder);
        input.setAttribute("data-property", label);
        if (options && options.id) {
            input.setAttribute("data-id", options.id);
        }
        var row = Util.ele("div", options?.rowClass || "column");
        if (label) row.appendChild(Util.ele("label", "", label));
        row.appendChild(input);
        input.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() == "enter") {
                if (modal.canConfirm && !modal.canConfirm()) return;
                callback(e.target.value);
                modal.close(true);
            }
        });
        return row;
    }

    return {
        createModal: modalBase,
        prompt: prompt,
        multiInputPrompt: multiInputPrompt,
    };
})();
