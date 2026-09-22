
/* =================================================
   CAMPUS LOST AND FOUND SYSTEM
   PHASE 8 - EDIT AND REMOVE OWN REPORTS

   This file works with the existing app.js.
   Do not replace app.js.
================================================= */

(function () {

    "use strict";

    let reportActionBusy = false;


    // ============================================
    // 1. SHOW A MESSAGE
    // ============================================

    function reportMessage(message, type = "success") {

        if (typeof showNotification === "function") {
            showNotification(message, type);
        } else {
            alert(message);
        }

    }


    // ============================================
    // 2. RELOAD MY REPORTS
    // ============================================

    async function refreshOwnReports() {

        if (typeof loadMyReports === "function") {
            await loadMyReports();
        }

    }


    // ============================================
    // 3. CREATE A FORM FIELD
    // ============================================

    function createEditField(
        form,
        labelText,
        name,
        value,
        options = {}
    ) {

        const wrapper = document.createElement("div");

        wrapper.className = "report-edit-field";


        const label = document.createElement("label");

        label.textContent = labelText;

        label.htmlFor = "edit-" + name;


        let field;

        if (options.multiline) {

            field = document.createElement("textarea");

            field.rows = 4;

        } else {

            field = document.createElement("input");

            field.type = options.type || "text";

        }


        field.id = "edit-" + name;

        field.name = name;

        field.value = value ?? "";

        field.required = Boolean(options.required);

        if (options.maxLength) {
            field.maxLength = options.maxLength;
        }


        wrapper.appendChild(label);

        wrapper.appendChild(field);

        form.appendChild(wrapper);

        return field;

    }


    // ============================================
    // 4. OPEN EDIT FORM
    // ============================================

    function openReportEditor(item) {

        if (reportActionBusy) {
            return;
        }


        const oldDialog =
            document.getElementById("report-edit-overlay");

        if (oldDialog) {
            oldDialog.remove();
        }


        const overlay = document.createElement("div");

        overlay.id = "report-edit-overlay";

        overlay.className = "report-edit-overlay";


        const panel = document.createElement("section");

        panel.className = "report-edit-panel";

        panel.setAttribute("role", "dialog");

        panel.setAttribute("aria-modal", "true");

        panel.setAttribute(
            "aria-label",
            "Edit your report"
        );


        const heading = document.createElement("h2");

        heading.textContent =
            item.report_type === "lost"
                ? "Edit Lost Report"
                : "Edit Found Report";

        panel.appendChild(heading);


        const note = document.createElement("p");

        note.textContent =
            "Edit the report details below. " +
            "Photos and item statuses cannot be changed here.";

        panel.appendChild(note);


        const form = document.createElement("form");

        form.id = "edit-report-form";


        createEditField(
            form,
            "Item Name",
            "name",
            item.item_name,
            {
                required: true,
                maxLength: 100
            }
        );


        createEditField(
            form,
            "Category",
            "category",
            item.category,
            {
                required: true,
                maxLength: 100
            }
        );


        createEditField(
            form,
            "Description",
            "description",
            item.description,
            {
                multiline: true,
                maxLength: 1000
            }
        );


        createEditField(
            form,
            "Color",
            "color",
            item.color,
            {
                maxLength: 50
            }
        );


        createEditField(
            form,
            item.report_type === "lost"
                ? "Date Lost"
                : "Date Found",
            "date",
            item.report_type === "lost"
                ? item.date_lost
                : item.date_found,
            {
                type: "date",
                required: true
            }
        );


        createEditField(
            form,
            item.report_type === "lost"
                ? "Location Lost"
                : "Location Found",
            "location",
            item.report_type === "lost"
                ? item.location_lost
                : item.location_found,
            {
                required: true,
                maxLength: 150
            }
        );


        if (item.report_type === "found") {

            createEditField(
                form,
                "Where is the item currently kept?",
                "current_location",
                item.current_location,
                {
                    required: true,
                    maxLength: 150
                }
            );

        }


        const actions = document.createElement("div");

        actions.className = "report-edit-actions";


        const cancelButton =
            document.createElement("button");

        cancelButton.type = "button";

        cancelButton.textContent = "Cancel";

        cancelButton.className =
            "report-cancel-btn";


        const saveButton =
            document.createElement("button");

        saveButton.type = "submit";

        saveButton.textContent = "Save Changes";


        actions.appendChild(cancelButton);

        actions.appendChild(saveButton);

        form.appendChild(actions);

        panel.appendChild(form);

        overlay.appendChild(panel);

        document.body.appendChild(overlay);


        function closeEditor() {

            if (!reportActionBusy) {
                overlay.remove();
            }

        }


        cancelButton.addEventListener(
            "click",
            closeEditor
        );


        overlay.addEventListener(
            "click",
            function (event) {

                if (event.target === overlay) {
                    closeEditor();
                }

            }
        );


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                if (reportActionBusy) {
                    return;
                }


                reportActionBusy = true;

                saveButton.disabled = true;

                saveButton.textContent = "Saving...";


                try {

                    const values = new FormData(form);

                    const { error } =
                        await supabaseClient.rpc(
                            "edit_own_report",
                            {
                                p_type: item.report_type,
                                p_id: item.id,
                                p_name: String(
                                    values.get("name") || ""
                                ).trim(),
                                p_category: String(
                                    values.get("category") || ""
                                ).trim(),
                                p_description: String(
                                    values.get("description") || ""
                                ).trim(),
                                p_color: String(
                                    values.get("color") || ""
                                ).trim(),
                                p_date: values.get("date"),
                                p_location: String(
                                    values.get("location") || ""
                                ).trim(),
                                p_current_location:
                                    item.report_type === "found"
                                        ? String(
                                            values.get(
                                                "current_location"
                                            ) || ""
                                        ).trim()
                                        : null
                            }
                        );


                    if (error) {
                        throw error;
                    }


                    overlay.remove();

                    reportMessage(
                        "Report updated successfully!"
                    );

                    await refreshOwnReports();


                } catch (error) {

                    console.error(
                        "Report edit error:",
                        error
                    );

                    reportMessage(
                        error.message,
                        "error"
                    );

                } finally {

                    reportActionBusy = false;

                    saveButton.disabled = false;

                    saveButton.textContent =
                        "Save Changes";

                }

            }
        );


        const firstInput = form.querySelector("input");

        if (firstInput) {
            firstInput.focus();
        }

    }


    // ============================================
    // 5. REMOVE OR CLOSE REPORT
    // ============================================

    async function removeOwnReport(item) {

        if (reportActionBusy) {
            return;
        }


        const confirmed = window.confirm(

            "Remove your " +
            item.report_type +
            " report for \"" +
            item.item_name +
            "\"?\n\n" +

            "If the report has no related claim or " +
            "handover history, it may be permanently " +
            "deleted.\n\n" +

            "If claim history must be retained, " +
            "the report may be closed instead.\n\n" +

            "Pending, approved, and returned items " +
            "cannot be removed."

        );


        if (!confirmed) {
            return;
        }


        reportActionBusy = true;


        try {

            const { data, error } =
                await supabaseClient.rpc(
                    "remove_own_report",
                    {
                        p_type: item.report_type,
                        p_id: item.id
                    }
                );


            if (error) {
                throw error;
            }


            if (data === "deleted") {

                reportMessage(
                    "Report permanently deleted."
                );

            } else if (data === "closed") {

                reportMessage(
                    "Report closed. Its history has been retained."
                );

            } else {

                reportMessage(
                    "Report updated."
                );

            }


            await refreshOwnReports();


        } catch (error) {

            console.error(
                "Report removal error:",
                error
            );

            reportMessage(
                error.message,
                "error"
            );

        } finally {

            reportActionBusy = false;

        }

    }


    // ============================================
    // 6. ADD EDIT AND REMOVE BUTTONS
    //
    // Reuse your existing card renderer.
    // This does not change Search Items cards.
    // ============================================

    const originalRenderItems = renderItems;


    renderItems = function (items, containerId) {

        originalRenderItems(items, containerId);


        if (containerId !== "my-reports-results") {
            return;
        }


        const container =
            document.getElementById(containerId);


        const cards =
            container.querySelectorAll(".item-card");


        items.forEach(function (item, index) {

            const card = cards[index];

            if (!card) {
                return;
            }


            // Closed, verified, and returned
            // reports cannot be edited or removed.

            const isEditable =
                item.report_type === "lost"
                    ? item.status === "lost"
                    : item.status === "found";


            if (!isEditable) {
                return;
            }


            const actions =
                document.createElement("div");

            actions.className =
                "report-management-actions";


            const editButton =
                document.createElement("button");

            editButton.type = "button";

            editButton.className =
                "report-edit-btn";

            editButton.textContent =
                "Edit Report";


            editButton.addEventListener(
                "click",
                function () {

                    openReportEditor(item);

                }
            );


            const removeButton =
                document.createElement("button");

            removeButton.type = "button";

            removeButton.className =
                "report-remove-btn";

            removeButton.textContent =
                "Remove Report";


            removeButton.addEventListener(
                "click",
                function () {

                    removeOwnReport(item);

                }
            );


            actions.appendChild(editButton);

            actions.appendChild(removeButton);

            card.appendChild(actions);

        });

    };


    console.log(
        "Phase 8 report management loaded."
    );

})();
