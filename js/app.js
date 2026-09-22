
/* ================================================
   CAMPUS LOST AND FOUND MANAGEMENT SYSTEM

   COMPLETE JAVASCRIPT - PHASE 5

   Features:
   - Registration and Login
   - User Dashboard
   - Lost Item Reporting
   - Found Item Reporting
   - Search and Filter
   - My Reports
   - Possible Item Matching
   - Ownership Claims
   - My Claims
   - Logout
================================================ */


// ================================================
// 1. GLOBAL VARIABLES
// ================================================

let currentUser = null;

let allSearchItems = [];

let currentSearchItems = [];

let notificationTimer = null;

let currentPageRequest = 0;


// ================================================
// 2. GET HTML ELEMENTS
// ================================================

const pages = document.querySelectorAll(".page");

const registerForm =
    document.getElementById("register-form");

const loginForm =
    document.getElementById("login-form");

const lostForm =
    document.getElementById("lost-form");

const foundForm =
    document.getElementById("found-form");

const claimForm =
    document.getElementById("claim-form");

const welcomeMessage =
    document.getElementById("welcome-message");

const notification =
    document.getElementById("notification");

const searchInput =
    document.getElementById("item-search");

const itemFilter =
    document.getElementById("item-filter");


// ================================================
// 3. PAGE NAVIGATION
// ================================================

function showPage(pageId) {

    currentPageRequest++;

    pages.forEach(function(page) {

        page.classList.add("hidden");

    });

    const selectedPage =
        document.getElementById(pageId);

    if (selectedPage) {

        selectedPage.classList.remove("hidden");

    }

    window.scrollTo(0, 0);

}


// ================================================
// 4. NOTIFICATION SYSTEM
// ================================================

function showNotification(
    message,
    type = "success"
) {

    if (!notification) {

        console.log(message);

        return;

    }

    if (notificationTimer) {

        clearTimeout(notificationTimer);

    }

    notification.textContent = message;

    notification.className =
        "notification " + type;

    notificationTimer = setTimeout(function() {

        notification.classList.add("hidden");

    }, 6000);

}


// ================================================
// 5. GET AUTHENTICATED USER
// ================================================

async function getAuthenticatedUser() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {

        currentUser = null;

        throw new Error(
            "Please log in to continue."
        );

    }

    currentUser = data.user;

    return data.user;

}


// ================================================
// 6. USER DASHBOARD
// ================================================

function showDashboard(user) {

    if (!user) {

        showPage("login-page");

        return;

    }

    currentUser = user;

    const fullName =
        user.user_metadata?.full_name ||
        user.email ||
        "User";

    welcomeMessage.textContent =
        "Welcome, " + fullName + "!";

    showPage("dashboard-page");

}


// ================================================
// 7. HOME AND AUTHENTICATION NAVIGATION
// ================================================

document.getElementById("get-started-btn")
    .addEventListener("click", function() {

        if (currentUser) {

            showDashboard(currentUser);

        } else {

            showPage("login-page");

        }

    });


document.getElementById("go-register")
    .addEventListener("click", function(event) {

        event.preventDefault();

        showPage("register-page");

    });


document.getElementById("go-login")
    .addEventListener("click", function(event) {

        event.preventDefault();

        showPage("login-page");

    });


document.getElementById("login-back-home")
    .addEventListener("click", function(event) {

        event.preventDefault();

        showPage("home-page");

    });


document.getElementById("register-back-home")
    .addEventListener("click", function(event) {

        event.preventDefault();

        showPage("home-page");

    });


// ================================================
// 8. USER REGISTRATION
// ================================================

registerForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const fullName =
            document.getElementById(
                "register-name"
            ).value.trim();

        const email =
            document.getElementById(
                "register-email"
            ).value.trim();

        const password =
            document.getElementById(
                "register-password"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirm-password"
            ).value;


        if (!fullName) {

            showNotification(
                "Please enter your full name.",
                "error"
            );

            return;

        }


        if (password.length < 8) {

            showNotification(
                "Password must contain at least 8 characters.",
                "error"
            );

            return;

        }


        if (password !== confirmPassword) {

            showNotification(
                "Passwords do not match.",
                "error"
            );

            return;

        }


        const button =
            registerForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;

        button.textContent = "Registering...";


        try {

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {

                            full_name: fullName

                        },

                        emailRedirectTo:
                            window.location.origin +
                            window.location.pathname

                    }

                });


            if (error) {

                throw error;

            }


            registerForm.reset();


            if (data.session && data.user) {

                showDashboard(data.user);

                showNotification(
                    "Registration successful!"
                );

            } else {

                showPage("login-page");

                showNotification(
                    "Registration submitted. Check your email for the confirmation link."
                );

            }


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            button.disabled = false;

            button.textContent = "Register";

        }

    }
);


// ================================================
// 9. USER LOGIN
// ================================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const email =
            document.getElementById(
                "login-email"
            ).value.trim();

        const password =
            document.getElementById(
                "login-password"
            ).value;


        const button =
            loginForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;

        button.textContent = "Logging in...";


        try {

            const { data, error } =
                await supabaseClient.auth
                    .signInWithPassword({

                        email: email,

                        password: password

                    });


            if (error) {

                throw error;

            }


            if (!data.user) {

                throw new Error(
                    "Unable to retrieve your account."
                );

            }


            loginForm.reset();

            showDashboard(data.user);

            showNotification(
                "Login successful!"
            );


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            button.disabled = false;

            button.textContent = "Login";

        }

    }
);


// ================================================
// 10. USER LOGOUT
// ================================================

document.getElementById("logout-btn")
    .addEventListener("click", async function() {

        try {

            const { error } =
                await supabaseClient.auth.signOut();

            if (error) {

                throw error;

            }

            currentUser = null;

            allSearchItems = [];

            currentSearchItems = [];

            showPage("home-page");

            showNotification(
                "You have successfully logged out."
            );


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        }

    });


// ================================================
// 11. DASHBOARD BUTTONS
// ================================================

document.getElementById("open-lost-btn")
    .addEventListener("click", function() {

        showPage("lost-page");

    });


document.getElementById("open-found-btn")
    .addEventListener("click", function() {

        showPage("found-page");

    });


document.getElementById("open-search-btn")
    .addEventListener("click", async function() {

        showPage("search-page");

        await loadSearchItems();

    });


document.getElementById("open-reports-btn")
    .addEventListener("click", async function() {

        showPage("reports-page");

        await loadMyReports();

    });


document.getElementById("open-claims-btn")
    .addEventListener("click", async function() {

        showPage("claims-page");

        await loadMyClaims();

    });


// ================================================
// 12. BACK TO DASHBOARD
// ================================================

document.querySelectorAll(
    "[data-back-dashboard]"
).forEach(function(button) {

    button.addEventListener(
        "click",
        async function() {

            try {

                const user =
                    await getAuthenticatedUser();

                showDashboard(user);

            } catch (error) {

                showNotification(
                    error.message,
                    "error"
                );

                showPage("login-page");

            }

        }
    );

});


// ================================================
// 13. SUBMIT LOST ITEM REPORT
// ================================================

lostForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            lostForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;

        button.textContent = "Submitting...";


        try {

            const user =
                await getAuthenticatedUser();


            const report = {

                user_id: user.id,

                item_name:
                    document.getElementById(
                        "lost-name"
                    ).value.trim(),

                category:
                    document.getElementById(
                        "lost-category"
                    ).value,

                description:
                    document.getElementById(
                        "lost-description"
                    ).value.trim(),

                color:
                    document.getElementById(
                        "lost-color"
                    ).value.trim(),

                date_lost:
                    document.getElementById(
                        "lost-date"
                    ).value,

                location_lost:
                    document.getElementById(
                        "lost-location"
                    ).value.trim(),

                status: "lost"

            };


            if (
                !report.item_name ||
                !report.category ||
                !report.date_lost ||
                !report.location_lost
            ) {

                throw new Error(
                    "Please complete all required fields."
                );

            }


            const { error } =
                await supabaseClient

                    .from("lost_items")

                    .insert(report);


            if (error) {

                throw error;

            }


            lostForm.reset();

            showDashboard(user);

            showNotification(
                "Lost item report submitted successfully!"
            );


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            button.disabled = false;

            button.textContent =
                "Submit Lost Report";

        }

    }
);


// ================================================
// 14. SUBMIT FOUND ITEM REPORT
// ================================================

foundForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            foundForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;

        button.textContent = "Submitting...";


        try {

            const user =
                await getAuthenticatedUser();


            const report = {

                user_id: user.id,

                item_name:
                    document.getElementById(
                        "found-name"
                    ).value.trim(),

                category:
                    document.getElementById(
                        "found-category"
                    ).value,

                description:
                    document.getElementById(
                        "found-description"
                    ).value.trim(),

                color:
                    document.getElementById(
                        "found-color"
                    ).value.trim(),

                date_found:
                    document.getElementById(
                        "found-date"
                    ).value,

                location_found:
                    document.getElementById(
                        "found-location"
                    ).value.trim(),

                current_location:
                    document.getElementById(
                        "found-current-location"
                    ).value.trim(),

                status: "found"

            };


            if (
                !report.item_name ||
                !report.category ||
                !report.date_found ||
                !report.location_found ||
                !report.current_location
            ) {

                throw new Error(
                    "Please complete all required fields."
                );

            }


            const { error } =
                await supabaseClient

                    .from("found_items")

                    .insert(report);


            if (error) {

                throw error;

            }


            foundForm.reset();

            showDashboard(user);

            showNotification(
                "Found item report submitted successfully!"
            );


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            button.disabled = false;

            button.textContent =
                "Submit Found Report";

        }

    }
);


// ================================================
// 15. LOAD ALL LOST AND FOUND ITEMS
// ================================================

async function loadSearchItems() {

    const results =
        document.getElementById(
            "search-results"
        );

    const requestId = currentPageRequest;

    results.replaceChildren();

    results.textContent = "Loading items...";


    try {

        await getAuthenticatedUser();


        const [lostResult, foundResult] =
            await Promise.all([

                supabaseClient
                    .from("lost_items")
                    .select("*")
                    .order("created_at", {
                        ascending: false
                    }),

                supabaseClient
                    .from("found_items")
                    .select("*")
                    .order("created_at", {
                        ascending: false
                    })

            ]);


        if (lostResult.error) {

            throw lostResult.error;

        }


        if (foundResult.error) {

            throw foundResult.error;

        }


        const lostItems =
            (lostResult.data || []).map(
                function(item) {

                    return {

                        ...item,

                        report_type: "lost"

                    };

                }
            );


        const foundItems =
            (foundResult.data || []).map(
                function(item) {

                    return {

                        ...item,

                        report_type: "found"

                    };

                }
            );


        // Store all reports for matching.

        allSearchItems = [

            ...lostItems,

            ...foundItems

        ];


        // Sort newest reports first.

        allSearchItems.sort(function(a, b) {

            return (
                new Date(b.created_at) -
                new Date(a.created_at)
            );

        });


        // Do not overwrite another page
        // if the user navigated away.

        if (requestId !== currentPageRequest) {

            return;

        }


        // Restore the full search results.

        currentSearchItems = allSearchItems;

        searchInput.value = "";

        itemFilter.value = "all";

        filterSearchItems();


    } catch (error) {

        console.error(error);

        if (requestId !== currentPageRequest) {

            return;

        }

        results.replaceChildren();

        const message =
            document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "Unable to load items: " +
            error.message;

        results.appendChild(message);

    }

}


// ================================================
// 16. SEARCH AND FILTER ITEMS
// ================================================

function filterSearchItems() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedType =
        itemFilter.value;


    const filteredItems =
        currentSearchItems.filter(function(item) {

            const matchesType =
                selectedType === "all" ||
                item.report_type === selectedType;


            const searchText = [

                item.item_name,

                item.category,

                item.color

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                searchText.includes(searchTerm);


            return matchesType && matchesSearch;

        });


    renderItems(
        filteredItems,
        "search-results"
    );

}


// Search input

searchInput.addEventListener(
    "input",
    filterSearchItems
);


// Item type filter

itemFilter.addEventListener(
    "change",
    filterSearchItems
);


// ================================================
// 17. FIND POSSIBLE MATCHES
// ================================================

function findPossibleMatches(lostItem) {

    function normalize(value) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    const matches =
        allSearchItems.filter(function(item) {

            // Only available found items.

            if (
                item.report_type !== "found" ||
                item.status !== "found"
            ) {

                return false;

            }


            // Compare item name.

            const nameMatches =
                normalize(item.item_name) ===
                normalize(lostItem.item_name);


            // Compare category.

            const categoryMatches =
                normalize(item.category) ===
                normalize(lostItem.category);


            // Compare color when both
            // reports specify a color.

            const colorMatches =
                !item.color ||
                !lostItem.color ||
                normalize(item.color) ===
                normalize(lostItem.color);


            return (
                nameMatches &&
                categoryMatches &&
                colorMatches
            );

        });


    return matches;

}


// ================================================
// 18. DISPLAY LOST AND FOUND ITEM CARDS
// ================================================

function renderItems(items, containerId) {

    const container =
        document.getElementById(containerId);


    container.replaceChildren();


    if (!items || items.length === 0) {

        const message =
            document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "No matching reports found.";

        container.appendChild(message);

        return;

    }


    // IMPORTANT:
    // Every item card and its buttons
    // must be created inside this loop.

    items.forEach(function(item) {

        const card =
            document.createElement("article");

        card.className = "item-card";


        // ITEM TYPE BADGE

        const badge =
            document.createElement("span");

        badge.className =
            "item-type " + item.report_type;

        badge.textContent =
            item.report_type === "lost"
                ? "LOST ITEM"
                : "FOUND ITEM";

        card.appendChild(badge);


        // ITEM NAME

        const title =
            document.createElement("h3");

        title.textContent =
            item.item_name || "Unnamed Item";

        card.appendChild(title);


        // HELPER FOR ITEM DETAILS

        function addDetail(label, value) {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return;

            }


            const paragraph =
                document.createElement("p");


            const labelElement =
                document.createElement("strong");

            labelElement.textContent =
                label + ": ";


            paragraph.appendChild(
                labelElement
            );


            paragraph.appendChild(
                document.createTextNode(
                    String(value)
                )
            );


            card.appendChild(
                paragraph
            );

        }


        // ITEM INFORMATION

        addDetail(
            "Category",
            item.category
        );


        addDetail(
            "Color",
            item.color
        );


        addDetail(
            "Date",
            item.report_type === "lost"
                ? item.date_lost
                : item.date_found
        );


        addDetail(
            "Location",
            item.report_type === "lost"
                ? item.location_lost
                : item.location_found
        );


        if (item.report_type === "found") {

            addDetail(
                "Currently Kept At",
                item.current_location
            );

        }


        // ITEM DESCRIPTION

        if (item.description) {

            const description =
                document.createElement("p");

            description.className =
                "item-description";

            description.textContent =
                item.description;

            card.appendChild(description);

        }


        // ITEM STATUS

        const status =
            document.createElement("p");

        status.className =
            "item-status";

        status.textContent =
            "Status: " +
            String(item.status || "unknown")
                .replaceAll("_", " ");

        card.appendChild(status);


        // ====================================
        // POSSIBLE MATCH AND CLAIM BUTTONS
        // ====================================

        // Buttons only appear on Search Items.

        if (containerId === "search-results") {


            // LOST ITEM:
            // DISPLAY POSSIBLE MATCHES

            if (
                item.report_type === "lost" &&
                item.status === "lost"
            ) {

                const matches =
                    findPossibleMatches(item);


                if (matches.length > 0) {

                    const matchLabel =
                        document.createElement("span");

                    matchLabel.className =
                        "possible-match";

                    matchLabel.textContent =
                        matches.length +
                        " POSSIBLE MATCH" +
                        (matches.length === 1
                            ? ""
                            : "ES");

                    card.appendChild(
                        matchLabel
                    );


                    const matchButton =
                        document.createElement("button");

                    matchButton.className =
                        "match-btn";

                    matchButton.textContent =
                        "View Possible Matches";


                    matchButton.addEventListener(
                        "click",
                        function() {

                            // Store the matched items.

                            currentSearchItems =
                                matches;


                            // Reset search controls.

                            searchInput.value = "";

                            itemFilter.value = "all";


                            // Display matching found items.

                            filterSearchItems();

                        }
                    );


                    card.appendChild(
                        matchButton
                    );

                }

            }


            // FOUND ITEM:
            // DISPLAY CLAIM BUTTON

            if (
                item.report_type === "found" &&
                item.status === "found" &&
                item.user_id !== currentUser?.id
            ) {

                const claimButton =
                    document.createElement("button");

                claimButton.className =
                    "claim-btn";

                claimButton.textContent =
                    "Claim This Item";


                claimButton.addEventListener(
                    "click",
                    function() {

                        openClaimForm(item);

                    }
                );


                card.appendChild(
                    claimButton
                );

            }

        }


        // ADD COMPLETED CARD TO PAGE

        container.appendChild(card);

    });

}


// ================================================
// 19. LOAD MY REPORTS
// ================================================

async function loadMyReports() {

    const results =
        document.getElementById(
            "my-reports-results"
        );

    const requestId = currentPageRequest;

    results.replaceChildren();

    results.textContent =
        "Loading your reports...";


    try {

        const user =
            await getAuthenticatedUser();


        const [lostResult, foundResult] =
            await Promise.all([

                supabaseClient
                    .from("lost_items")
                    .select("*")
                    .eq("user_id", user.id),

                supabaseClient
                    .from("found_items")
                    .select("*")
                    .eq("user_id", user.id)

            ]);


        if (lostResult.error) {

            throw lostResult.error;

        }


        if (foundResult.error) {

            throw foundResult.error;

        }


        const lostItems =
            (lostResult.data || []).map(
                function(item) {

                    return {

                        ...item,

                        report_type: "lost"

                    };

                }
            );


        const foundItems =
            (foundResult.data || []).map(
                function(item) {

                    return {

                        ...item,

                        report_type: "found"

                    };

                }
            );


        const allReports = [

            ...lostItems,

            ...foundItems

        ];


        allReports.sort(function(a, b) {

            return (
                new Date(b.created_at) -
                new Date(a.created_at)
            );

        });


        if (requestId !== currentPageRequest) {

            return;

        }


        renderItems(
            allReports,
            "my-reports-results"
        );


    } catch (error) {

        console.error(error);

        if (requestId !== currentPageRequest) {

            return;

        }

        results.replaceChildren();

        const message =
            document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "Unable to load reports: " +
            error.message;

        results.appendChild(message);

    }

}


// ================================================
// 20. OPEN OWNERSHIP CLAIM FORM
// ================================================

function openClaimForm(item) {

    if (
        !item ||
        item.report_type !== "found" ||
        item.status !== "found"
    ) {

        showNotification(
            "This found item is not available for claiming.",
            "error"
        );

        return;

    }


    if (item.user_id === currentUser?.id) {

        showNotification(
            "You cannot claim an item you reported yourself.",
            "error"
        );

        return;

    }


    claimForm.reset();


    // Store selected found item ID.

    document.getElementById(
        "claim-found-id"
    ).value = item.id;


    // Display selected item name.

    document.getElementById(
        "claim-item-name"
    ).textContent = item.item_name;


    // Display basic item details.

    document.getElementById(
        "claim-item-details"
    ).textContent =

        "Category: " +
        item.category +

        " | Color: " +
        (item.color || "Not specified") +

        " | Found at: " +
        item.location_found;


    showPage("claim-page");

}


// ================================================
// 21. BACK TO SEARCH ITEMS
// ================================================

document.getElementById("claim-back-btn")
    .addEventListener("click", async function() {

        showPage("search-page");

        await loadSearchItems();

    });


// ================================================
// 22. SUBMIT OWNERSHIP CLAIM
// ================================================

claimForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            claimForm.querySelector(
                'button[type="submit"]'
            );

        button.disabled = true;

        button.textContent =
            "Submitting Claim...";


        try {

            const user =
                await getAuthenticatedUser();


            const foundItemId =
                Number(
                    document.getElementById(
                        "claim-found-id"
                    ).value
                );


            const description =
                document.getElementById(
                    "claim-description"
                ).value.trim();


            if (
                !Number.isSafeInteger(foundItemId) ||
                foundItemId <= 0
            ) {

                throw new Error(
                    "Please select a valid found item."
                );

            }


            if (description.length < 10) {

                throw new Error(
                    "Please provide more identifying details."
                );

            }


            // Retrieve the latest found-item status
            // from the database.

            const { data: foundItem, error: itemError } =
                await supabaseClient

                    .from("found_items")

                    .select("id, user_id, status")

                    .eq("id", foundItemId)

                    .single();


            if (itemError) {

                throw itemError;

            }


            if (foundItem.status !== "found") {

                throw new Error(
                    "This item is no longer available for claiming."
                );

            }


            if (foundItem.user_id === user.id) {

                throw new Error(
                    "You cannot claim an item you reported yourself."
                );

            }


            // Check for an existing claim.

            const { data: existingClaim, error: checkError } =
                await supabaseClient

                    .from("claims")

                    .select("id")

                    .eq("found_item_id", foundItemId)

                    .eq("claimant_id", user.id)

                    .maybeSingle();


            if (checkError) {

                throw checkError;

            }


            if (existingClaim) {

                throw new Error(
                    "You have already submitted a claim for this item."
                );

            }


            // Save ownership claim.

            const { error } =
                await supabaseClient

                    .from("claims")

                    .insert({

                        found_item_id: foundItemId,

                        claimant_id: user.id,

                        claim_description: description,

                        status: "pending"

                    });


            if (error) {

                if (error.code === "23505") {

                    throw new Error(
                        "You have already submitted a claim for this item."
                    );

                }

                throw error;

            }


            claimForm.reset();


            showPage("claims-page");

            showNotification(
                "Your ownership claim has been submitted for verification!"
            );


            await loadMyClaims();


        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );


        } finally {

            button.disabled = false;

            button.textContent =
                "Submit Claim Request";

        }

    }
);


// ================================================
// 23. LOAD MY OWNERSHIP CLAIMS
// ================================================

async function loadMyClaims() {

    const container =
        document.getElementById(
            "my-claims-results"
        );

    const requestId = currentPageRequest;


    container.replaceChildren();

    container.textContent =
        "Loading your claims...";


    try {

        const user =
            await getAuthenticatedUser();


        const { data: claims, error } =
            await supabaseClient

                .from("claims")

                .select(`
                    id,
                    found_item_id,
                    claim_description,
                    status,
                    created_at,
                    found_items (
                        item_name,
                        category,
                        color
                    )
                `)

                .eq("claimant_id", user.id)

                .order("created_at", {
                    ascending: false
                });


        if (error) {

            throw error;

        }


        if (requestId !== currentPageRequest) {

            return;

        }


        container.replaceChildren();


        if (!claims || claims.length === 0) {

            const message =
                document.createElement("p");

            message.className =
                "empty-message";

            message.textContent =
                "You have not submitted any ownership claims.";

            container.appendChild(message);

            return;

        }


        claims.forEach(function(claim) {

            const card =
                document.createElement("article");

            card.className = "claim-card";


            // FOUND ITEM NAME

            const title =
                document.createElement("h3");

            title.textContent =
                claim.found_items?.item_name ||
                "Found Item #" +
                claim.found_item_id;

            card.appendChild(title);


            // CLAIM NUMBER

            const claimNumber =
                document.createElement("p");

            claimNumber.textContent =
                "Claim Number: " +
                claim.id;

            card.appendChild(claimNumber);


            // CATEGORY

            const category =
                document.createElement("p");

            category.textContent =
                "Category: " +
                (claim.found_items?.category || "N/A");

            card.appendChild(category);


            // DATE SUBMITTED

            const date =
                document.createElement("p");

            date.textContent =
                "Date Submitted: " +

                new Date(
                    claim.created_at
                ).toLocaleString();

            card.appendChild(date);


            // OWNERSHIP DESCRIPTION

            const description =
                document.createElement("p");

            description.textContent =
                "Your Ownership Description: " +
                claim.claim_description;

            card.appendChild(description);


            // CLAIM STATUS

            const status =
                document.createElement("span");

            status.className =
                "claim-status " +
                claim.status;


            if (claim.status === "pending") {

                status.textContent =
                    "PENDING VERIFICATION";

            } else if (claim.status === "approved") {

                status.textContent =
                    "APPROVED";

            } else if (claim.status === "rejected") {

                status.textContent =
                    "REJECTED";

            } else {

                status.textContent =
                    String(claim.status).toUpperCase();

            }


            card.appendChild(status);


            // ADD COMPLETED CLAIM CARD

            container.appendChild(card);

        });


    } catch (error) {

        console.error(error);

        if (requestId !== currentPageRequest) {

            return;

        }

        container.replaceChildren();

        const message =
            document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "Unable to load claims: " +
            error.message;

        container.appendChild(message);

    }

}


// ================================================
// 24. AUTHENTICATION STATE CHANGES
// ================================================

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        if (event === "SIGNED_OUT") {

            currentUser = null;

            allSearchItems = [];

            currentSearchItems = [];

            showPage("home-page");

        }


        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {

            currentUser = session.user;

        }

    }
);


// ================================================
// 25. CHECK EXISTING LOGIN SESSION
// ================================================

async function checkSession() {

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();


        if (error) {

            throw error;

        }


        if (data.session?.user) {

            showDashboard(
                data.session.user
            );

        } else {

            currentUser = null;

            showPage("home-page");

        }


    } catch (error) {

        console.error(error);

        currentUser = null;

        showPage("home-page");

    }

}


// ================================================
// 26. START APPLICATION
// ================================================

checkSession();
