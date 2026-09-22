
/* ==========================================
   CAMPUS LOST AND FOUND SYSTEM
   ADMIN DASHBOARD
========================================== */

let adminVerified = false;
let adminBusy = false;

const adminAccess =
    document.getElementById("admin-access");

const adminClaimsResults =
    document.getElementById("admin-claims-results");

const adminHandoversResults =
    document.getElementById("admin-handovers-results");


// ==========================================
// 1. CHECK ADMINISTRATOR ACCOUNT
// ==========================================

async function checkAdminRole() {

    try {

        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError || !userData.user) {

            adminVerified = false;
            adminAccess.classList.add("hidden");

            return false;
        }

        const { data: profile, error } =
            await supabaseClient
                .from("profiles")
                .select("role")
                .eq("id", userData.user.id)
                .single();

        if (error) {
            throw error;
        }

        adminVerified = profile?.role === "admin";

        console.log(
            "Current user role:",
            profile?.role
        );

        if (adminVerified) {

            adminAccess.classList.remove("hidden");

        } else {

            adminAccess.classList.add("hidden");

        }

        return adminVerified;

    } catch (error) {

        console.error("Admin check error:", error);

        adminVerified = false;
        adminAccess.classList.add("hidden");

        return false;
    }
}


// ==========================================
// 2. OPEN ADMIN DASHBOARD
// ==========================================

document.getElementById("open-admin-btn")
    .addEventListener("click", async function() {

        const allowed = await checkAdminRole();

        if (!allowed) {

            showNotification(
                "Administrator access required.",
                "error"
            );

            return;
        }

        showPage("admin-page");

        await loadAdminDashboard();
    });


// ==========================================
// 3. BACK TO USER DASHBOARD
// ==========================================

document.getElementById("admin-back-btn")
    .addEventListener("click", async function() {

        try {

            const user = await getAuthenticatedUser();

            showDashboard(user);

            await checkAdminRole();

        } catch (error) {

            showNotification(error.message, "error");

            showPage("login-page");
        }
    });


// ==========================================
// 4. REFRESH ADMIN DASHBOARD
// ==========================================

document.getElementById("admin-refresh-btn")
    .addEventListener("click", function() {

        loadAdminDashboard();
    });


// ==========================================
// 5. HELPER: DISPLAY RECORD DETAILS
// ==========================================

function addAdminDetail(card, label, value) {

    const paragraph = document.createElement("p");

    const strong = document.createElement("strong");

    strong.textContent = label + ": ";

    paragraph.appendChild(strong);

    paragraph.appendChild(
        document.createTextNode(
            String(value ?? "Not available")
        )
    );

    card.appendChild(paragraph);
}


// ==========================================
// 6. LOAD ADMIN DASHBOARD
// ==========================================

async function loadAdminDashboard() {

    if (adminBusy) return;

    adminBusy = true;

    try {

        const allowed = await checkAdminRole();

        if (!allowed) {

            showPage("dashboard-page");

            throw new Error(
                "Administrator access required."
            );
        }

        adminClaimsResults.textContent =
            "Loading ownership claims...";

        adminHandoversResults.textContent =
            "Loading handover history...";


        // Get database records

        const [
            lostResult,
            foundResult,
            claimsResult,
            handoversResult
        ] = await Promise.all([

            supabaseClient
                .from("lost_items")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            supabaseClient
                .from("found_items")
                .select("id", {
                    count: "exact",
                    head: true
                }),

            supabaseClient
                .from("claims")
                .select(`
                    id,
                    claimant_id,
                    found_item_id,
                    claim_description,
                    status,
                    created_at,
                    found_items (
                        item_name,
                        category,
                        color,
                        user_id,
                        status,
                        current_location
                    )
                `)
                .order("created_at", {
                    ascending: false
                }),

            supabaseClient
                .from("handover_records")
                .select("*")
                .order("date_released", {
                    ascending: false
                })

        ]);


        // Check errors

        for (const result of [
            lostResult,
            foundResult,
            claimsResult,
            handoversResult
        ]) {

            if (result.error) {
                throw result.error;
            }
        }


        const claims = claimsResult.data || [];

        const handovers = handoversResult.data || [];


        // ==================================
        // DASHBOARD STATISTICS
        // ==================================

        document.getElementById(
            "admin-lost-count"
        ).textContent = lostResult.count ?? 0;


        document.getElementById(
            "admin-found-count"
        ).textContent = foundResult.count ?? 0;


        document.getElementById(
            "admin-pending-count"
        ).textContent = claims.filter(
            claim => claim.status === "pending"
        ).length;


        document.getElementById(
            "admin-returned-count"
        ).textContent = handovers.length;


        // ==================================
        // LOAD USER NAMES
        // ==================================

        const userIds = new Set();

        claims.forEach(function(claim) {

            userIds.add(claim.claimant_id);

            if (claim.found_items?.user_id) {

                userIds.add(claim.found_items.user_id);
            }
        });

        handovers.forEach(function(record) {

            userIds.add(record.released_by);

            userIds.add(record.received_by);
        });


        const names = {};

        if (userIds.size > 0) {

            const { data: profiles, error } =
                await supabaseClient
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", Array.from(userIds));

            if (error) {
                throw error;
            }

            (profiles || []).forEach(function(profile) {

                names[profile.id] = profile.full_name;
            });
        }


        // Display the results

        renderAdminClaims(claims, names);

        renderAdminHandovers(
            handovers,
            claims,
            names
        );

    } catch (error) {

        console.error("Admin dashboard error:", error);

        showNotification(
            error.message,
            "error"
        );

        adminClaimsResults.textContent =
            "Unable to load administrator records.";

        adminHandoversResults.textContent =
            "Unable to load handover history.";

    } finally {

        adminBusy = false;
    }
}


// ==========================================
// 7. DISPLAY OWNERSHIP CLAIMS
// ==========================================

function renderAdminClaims(claims, names) {

    adminClaimsResults.replaceChildren();

    if (claims.length === 0) {

        adminClaimsResults.textContent =
            "No ownership claims have been submitted.";

        return;
    }

    claims.forEach(function(claim) {

        const item = claim.found_items;

        const card = document.createElement("article");

        card.className = "admin-claim-card";


        const title = document.createElement("h3");

        title.textContent =
            item?.item_name || "Found Item #" +
            claim.found_item_id;

        card.appendChild(title);


        addAdminDetail(
            card,
            "Claim Number",
            claim.id
        );

        addAdminDetail(
            card,
            "Claimant",
            names[claim.claimant_id] || "Unknown user"
        );

        addAdminDetail(
            card,
            "Found By",
            names[item?.user_id] || "Unknown user"
        );

        addAdminDetail(
            card,
            "Category",
            item?.category
        );

        addAdminDetail(
            card,
            "Current Location",
            item?.current_location
        );

        addAdminDetail(
            card,
            "Ownership Description",
            claim.claim_description
        );

        addAdminDetail(
            card,
            "Date Submitted",
            new Date(claim.created_at).toLocaleString()
        );


        const status = document.createElement("span");

        status.className =
            "claim-status " + claim.status;

        status.textContent =
            claim.status.toUpperCase();

        card.appendChild(status);


        // ADMIN ACTION BUTTONS

        const actions = document.createElement("div");

        actions.className = "admin-actions";


        if (claim.status === "pending") {

            const approveButton =
                document.createElement("button");

            approveButton.className =
                "admin-approve-btn";

            approveButton.textContent = "Approve";

            approveButton.onclick = function() {

                approveOwnershipClaim(claim.id);
            };


            const rejectButton =
                document.createElement("button");

            rejectButton.className =
                "admin-reject-btn";

            rejectButton.textContent = "Reject";

            rejectButton.onclick = function() {

                rejectOwnershipClaim(claim.id);
            };


            actions.appendChild(approveButton);

            actions.appendChild(rejectButton);
        }


        if (
            claim.status === "approved" &&
            item?.status === "verified"
        ) {

            const handoverButton =
                document.createElement("button");

            handoverButton.className =
                "admin-handover-btn";

            handoverButton.textContent =
                "Complete Handover";

            handoverButton.onclick = function() {

                completeItemHandover(claim.id);
            };

            actions.appendChild(handoverButton);
        }


        if (actions.children.length > 0) {

            card.appendChild(actions);
        }


        adminClaimsResults.appendChild(card);
    });
}


// ==========================================
// 8. APPROVE OWNERSHIP CLAIM
// ==========================================

async function approveOwnershipClaim(claimId) {

    if (adminBusy) return;

    const confirmed = window.confirm(
        "Have you verified the claimant's ownership? " +
        "Approve this claim?"
    );

    if (!confirmed) return;

    await performAdminAction(
        "approve_claim",
        { p_claim_id: claimId },
        "Ownership claim approved successfully!"
    );
}


// ==========================================
// 9. REJECT OWNERSHIP CLAIM
// ==========================================

async function rejectOwnershipClaim(claimId) {

    if (adminBusy) return;

    const confirmed = window.confirm(
        "Are you sure you want to reject this claim?"
    );

    if (!confirmed) return;

    await performAdminAction(
        "reject_claim",
        { p_claim_id: claimId },
        "Ownership claim rejected."
    );
}


// ==========================================
// 10. COMPLETE ITEM HANDOVER
// ==========================================

async function completeItemHandover(claimId) {

    if (adminBusy) return;

    const confirmed = window.confirm(
        "Has the approved claimant physically received " +
        "the item? Confirm the completed handover."
    );

    if (!confirmed) return;


    const remarks = window.prompt(
        "Enter handover remarks:",
        "Item released at the School Security Office."
    );

    if (remarks === null) return;


    await performAdminAction(
        "complete_handover",
        {
            p_claim_id: claimId,
            p_remarks: remarks.trim()
        },
        "Item handover completed successfully!"
    );
}


// ==========================================
// 11. SECURE ADMIN ACTION HELPER
// ==========================================

async function performAdminAction(
    functionName,
    parameters,
    successMessage
) {

    if (adminBusy) return;

    adminBusy = true;

    let succeeded = false;

    try {

        const allowed = await checkAdminRole();

        if (!allowed) {

            throw new Error(
                "Administrator access required."
            );
        }


        const { error } = await supabaseClient.rpc(
            functionName,
            parameters
        );

        if (error) {
            throw error;
        }

        succeeded = true;

        showNotification(successMessage);

    } catch (error) {

        console.error(error);

        showNotification(
            error.message,
            "error"
        );

    } finally {

        adminBusy = false;
    }


    if (succeeded) {

        await loadAdminDashboard();
    }
}


// ==========================================
// 12. DISPLAY HANDOVER HISTORY
// ==========================================

function renderAdminHandovers(
    handovers,
    claims,
    names
) {

    adminHandoversResults.replaceChildren();

    if (handovers.length === 0) {

        adminHandoversResults.textContent =
            "No completed handovers yet.";

        return;
    }


    handovers.forEach(function(record) {

        const claim = claims.find(
            item => item.id === record.claim_id
        );

        const card = document.createElement("article");

        card.className = "admin-claim-card";


        const title = document.createElement("h3");

        title.textContent =
            claim?.found_items?.item_name ||
            "Found Item #" + record.found_item_id;

        card.appendChild(title);


        addAdminDetail(
            card,
            "Handover Number",
            record.id
        );

        addAdminDetail(
            card,
            "Found By",
            names[claim?.found_items?.user_id] ||
            "Unknown user"
        );

        addAdminDetail(
            card,
            "Released By",
            names[record.released_by] ||
            "Unknown administrator"
        );

        addAdminDetail(
            card,
            "Received By",
            names[record.received_by] ||
            "Unknown user"
        );

        addAdminDetail(
            card,
            "Date Released",
            new Date(
                record.date_released
            ).toLocaleString()
        );

        addAdminDetail(
            card,
            "Remarks",
            record.remarks || "None"
        );


        const status = document.createElement("span");

        status.className = "claim-status approved";

        status.textContent = "RETURNED";

        card.appendChild(status);


        adminHandoversResults.appendChild(card);
    });
}


// ==========================================
// 13. AUTHENTICATION CHANGES
// ==========================================

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        if (event === "SIGNED_OUT") {

            adminVerified = false;

            adminAccess.classList.add("hidden");

            return;
        }

        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {

            setTimeout(function() {

                checkAdminRole();

            }, 0);
        }
    }
);


// ==========================================
// 14. INITIAL ADMIN CHECK
// ==========================================

setTimeout(function() {

    checkAdminRole();

}, 0);
