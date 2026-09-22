
/* ==================================================
   CAMPUS LOST AND FOUND SYSTEM
   PHASE 9A - BETTER MATCHING WITH REASONS

   Keep app.js, photo.js, reports.js,
   and admin.js unchanged.

   This file adds improved matching to the
   existing Search Items page.
================================================== */

(function () {

    "use strict";

    // Remember which found items are being shown
    // as possible matches for a selected lost item.

    let selectedMatchReasons = null;


    // ==============================================
    // 1. NORMALIZE ITEM DETAILS
    // ==============================================

    function normalize(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    }


    // Words that do not help distinguish items.

    const COMMON_WORDS = new Set([
        "a",
        "an",
        "the",
        "my",
        "item",
        "lost",
        "found",
        "color",
        "coloured",
        "colored",
        "small",
        "large",
        "big"
    ]);


    function meaningfulWords(value) {

        return normalize(value)
            .split(" ")
            .filter(function (word) {

                return (
                    word.length >= 4 &&
                    !COMMON_WORDS.has(word)
                );

            });

    }


    // ==============================================
    // 2. COMPARE ITEM NAMES
    // ==============================================

    function compareNames(lostName, foundName) {

        const lost = normalize(lostName);

        const found = normalize(foundName);


        if (!lost || !found) {

            return {
                matches: false,
                reason: ""
            };

        }


        if (lost === found) {

            return {
                matches: true,
                reason: "Same item name"
            };

        }


        const lostWords = meaningfulWords(lostName);

        const foundWords = meaningfulWords(foundName);


        // Do not suggest a match based only on
        // very short or generic words.

        const sharedWords = lostWords.filter(
            function (word) {

                return foundWords.includes(word);

            }
        );


        if (sharedWords.length === 0) {

            return {
                matches: false,
                reason: ""
            };

        }


        return {
            matches: true,
            reason:
                'Shared item-name keyword: "' +
                sharedWords[0] +
                '"'
        };

    }


    // ==============================================
    // 3. COMPARE DATES
    // ==============================================

    function compareDates(lostDate, foundDate) {

        if (!lostDate || !foundDate) {

            return "Dates were not fully specified";

        }


        // Append a time so a date-only value is
        // interpreted consistently in the browser.

        const lost =
            new Date(lostDate + "T12:00:00");

        const found =
            new Date(foundDate + "T12:00:00");


        if (
            Number.isNaN(lost.getTime()) ||
            Number.isNaN(found.getTime())
        ) {

            return "Dates need manual review";

        }


        const daysApart = Math.round(
            (found.getTime() - lost.getTime()) /
            (1000 * 60 * 60 * 24)
        );


        if (daysApart === 0) {

            return "Lost and found dates are the same";

        }


        if (daysApart > 0 && daysApart <= 30) {

            return (
                "Found " +
                daysApart +
                " day" +
                (daysApart === 1 ? "" : "s") +
                " after the reported loss"
            );

        }


        if (daysApart > 30) {

            return (
                "Found more than 30 days after " +
                "the reported loss; review the dates"
            );

        }


        return (
            "Found date is earlier than the reported " +
            "lost date; review the dates"
        );

    }


    // ==============================================
    // 4. COMPARE LOCATIONS
    // ==============================================

    function compareLocations(
        lostLocation,
        foundLocation
    ) {

        const lost = normalize(lostLocation);

        const found = normalize(foundLocation);


        if (!lost || !found) {

            return "Locations were not fully specified";

        }


        if (lost === found) {

            return "Same reported location";

        }


        const lostWords = meaningfulWords(
            lostLocation
        );

        const foundWords = meaningfulWords(
            foundLocation
        );


        const sharedWord = lostWords.find(
            function (word) {

                return foundWords.includes(word);

            }
        );


        if (sharedWord) {

            return (
                'Locations share the word "' +
                sharedWord +
                '"'
            );

        }


        return (
            "Different reported locations; " +
            "the item may have been moved"
        );

    }


    // ==============================================
    // 5. ASSESS ONE POSSIBLE MATCH
    // ==============================================

    function assessPossibleMatch(
        lostItem,
        foundItem
    ) {

        if (
            lostItem.report_type !== "lost" ||
            lostItem.status !== "lost" ||
            foundItem.report_type !== "found" ||
            foundItem.status !== "found"
        ) {

            return null;

        }


        // Category must match.

        const lostCategory =
            normalize(lostItem.category);

        const foundCategory =
            normalize(foundItem.category);


        if (
            !lostCategory ||
            lostCategory !== foundCategory
        ) {

            return null;

        }


        // Item names must match exactly or
        // have a meaningful shared keyword.

        const nameResult = compareNames(
            lostItem.item_name,
            foundItem.item_name
        );


        if (!nameResult.matches) {

            return null;

        }


        // If both reports specify different colors,
        // do not suggest them as a match.

        const lostColor =
            normalize(lostItem.color);

        const foundColor =
            normalize(foundItem.color);


        if (
            lostColor &&
            foundColor &&
            lostColor !== foundColor
        ) {

            return null;

        }


        const reasons = [

            nameResult.reason,

            "Same category"

        ];


        if (lostColor && foundColor) {

            reasons.push("Same color");

        } else {

            reasons.push(
                "Color was not specified in both reports"
            );

        }


        // Dates and locations provide context.
        // They do not automatically prove or
        // disprove that two reports match.

        reasons.push(
            compareDates(
                lostItem.date_lost,
                foundItem.date_found
            )
        );


        reasons.push(
            compareLocations(
                lostItem.location_lost,
                foundItem.location_found
            )
        );


        return {

            item: foundItem,

            reasons: reasons

        };

    }


    // ==============================================
    // 6. FIND ALL POSSIBLE MATCHES
    // ==============================================

    function getImprovedMatches(lostItem) {

        return allSearchItems
            .map(function (foundItem) {

                return assessPossibleMatch(
                    lostItem,
                    foundItem
                );

            })
            .filter(Boolean);

    }


    // ==============================================
    // 7. CREATE MATCH REASONS PANEL
    // ==============================================

    function createReasonsPanel(reasons) {

        const panel =
            document.createElement("div");

        panel.className = "matching-reasons";


        const heading =
            document.createElement("strong");

        heading.textContent =
            "Why this item was suggested:";

        panel.appendChild(heading);


        const list =
            document.createElement("ul");


        reasons.forEach(function (reason) {

            const listItem =
                document.createElement("li");

            listItem.textContent = reason;

            list.appendChild(listItem);

        });


        panel.appendChild(list);


        const note =
            document.createElement("p");

        note.className = "matching-disclaimer";

        note.textContent =
            "This is a possible match, not proof " +
            "of ownership. An administrator must " +
            "verify any ownership claim.";

        panel.appendChild(note);


        return panel;

    }


    // ==============================================
    // 8. EXTEND THE EXISTING ITEM RENDERER
    //
    // reports.js already extends renderItems().
    // Call that existing version first so the
    // Phase 8 Edit and Remove buttons still work.
    // ==============================================

    const previousRenderItems = renderItems;


    renderItems = function (items, containerId) {

        previousRenderItems(
            items,
            containerId
        );


        if (containerId !== "search-results") {

            return;

        }


        // A fresh Search Items load restores
        // currentSearchItems to allSearchItems.

        if (currentSearchItems === allSearchItems) {

            selectedMatchReasons = null;

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


            // ==================================
            // LOST ITEM: IMPROVED MATCH BUTTON
            // ==================================

            if (
                item.report_type === "lost" &&
                item.status === "lost"
            ) {

                const matches =
                    getImprovedMatches(item);


                // Remove only the OLD matching UI
                // created by app.js.

                const oldMatchLabel =
                    card.querySelector(".possible-match");

                const oldMatchButton =
                    card.querySelector(".match-btn");


                if (oldMatchLabel) {

                    oldMatchLabel.remove();

                }


                if (oldMatchButton) {

                    oldMatchButton.remove();

                }


                if (matches.length === 0) {

                    return;

                }


                const label =
                    document.createElement("span");

                label.className = "possible-match";

                label.textContent =
                    matches.length +
                    " POSSIBLE MATCH" +
                    (matches.length === 1 ? "" : "ES");

                card.appendChild(label);


                const button =
                    document.createElement("button");

                button.type = "button";

                button.className = "match-btn";

                button.textContent =
                    "View Possible Matches";


                button.addEventListener(
                    "click",
                    function () {

                        // Store explanations using each
                        // found item's database ID.

                        selectedMatchReasons =
                            new Map();


                        matches.forEach(
                            function (match) {

                                selectedMatchReasons.set(
                                    String(match.item.id),
                                    match.reasons
                                );

                            }
                        );


                        // Show only the matching
                        // found-item reports.

                        currentSearchItems =
                            matches.map(
                                function (match) {

                                    return match.item;

                                }
                            );


                        searchInput.value = "";

                        itemFilter.value = "all";


                        filterSearchItems();


                        // Return to the top of results
                        // so the matching cards are visible.

                        container.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }
                );


                card.appendChild(button);

            }


            // ==================================
            // FOUND ITEM: EXPLAIN THE MATCH
            // ==================================

            if (
                item.report_type === "found" &&
                selectedMatchReasons
            ) {

                const reasons =
                    selectedMatchReasons.get(
                        String(item.id)
                    );


                if (reasons) {

                    const panel =
                        createReasonsPanel(reasons);


                    // Put the explanation above the
                    // Claim This Item button, if present.

                    const claimButton =
                        card.querySelector(".claim-btn");


                    if (claimButton) {

                        card.insertBefore(
                            panel,
                            claimButton
                        );

                    } else {

                        card.appendChild(panel);

                    }

                }

            }

        });

    };


    // ==============================================
    // 9. CLEAR MATCH MODE ON SEARCH NAVIGATION
    // ==============================================

    const openSearchButton =
        document.getElementById(
            "open-search-btn"
        );


    if (openSearchButton) {

        openSearchButton.addEventListener(
            "click",
            function () {

                selectedMatchReasons = null;

            }
        );

    }


    console.log(
        "Phase 9A improved matching loaded."
    );

})();
