/* ========================================
   CAMPUS LOST AND FOUND
   AUTHENTICATION SYSTEM
======================================== */


// ========================================
// 1. GET WEBSITE ELEMENTS
// ========================================

const pages = document.querySelectorAll(".page");

const registerForm =
    document.getElementById("register-form");

const loginForm =
    document.getElementById("login-form");

const welcomeMessage =
    document.getElementById("welcome-message");

const notification =
    document.getElementById("notification");

let currentUser = null;


// ========================================
// 2. PAGE NAVIGATION
// ========================================

function showPage(pageId) {

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


// ========================================
// 3. DISPLAY NOTIFICATIONS
// ========================================

function showNotification(message, type = "success") {

    notification.textContent = message;

    notification.className =
        "notification " + type;

}


// ========================================
// 4. NAVIGATION BUTTONS
// ========================================

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


// ========================================
// 5. REGISTER NEW USER
// ========================================

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


        // Check name

        if (!fullName) {

            showNotification(
                "Please enter your full name.",
                "error"
            );

            return;

        }


        // Check password length

        if (password.length < 8) {

            showNotification(
                "Password must contain at least 8 characters.",
                "error"
            );

            return;

        }


        // Confirm passwords match

        if (password !== confirmPassword) {

            showNotification(
                "Passwords do not match.",
                "error"
            );

            return;

        }


        const submitButton =
            registerForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent = "Registering...";


        try {

            // Register with Supabase

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


            // Clear registration form

            registerForm.reset();


            if (data.session) {

                // Email confirmation is disabled.
                // User is already authenticated.

                showNotification(
                    "Registration successful!"
                );

                showDashboard(data.user);

            } else {

                // Email confirmation is enabled.

                showNotification(
                    "Registration submitted! Check your email for the confirmation link."
                );

                showPage("login-page");

            }

        } catch (error) {

            showNotification(
                error.message,
                "error"
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent = "Register";

        }

    }
);


// ========================================
// 6. LOGIN USER
// ========================================

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


        const submitButton =
            loginForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";


        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                throw error;

            }


            loginForm.reset();

            showNotification(
                "Login successful!"
            );

            showDashboard(data.user);

        } catch (error) {

            showNotification(
                error.message,
                "error"
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent = "Login";

        }

    }
);


// ========================================
// 7. USER DASHBOARD
// ========================================

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


// ========================================
// 8. LOGOUT
// ========================================

document.getElementById("logout-btn")
    .addEventListener("click", async function() {

        try {

            const { error } =
                await supabaseClient.auth.signOut();

            if (error) {

                throw error;

            }

            currentUser = null;

            showPage("home-page");

            showNotification(
                "You have successfully logged out."
            );

        } catch (error) {

            showNotification(
                error.message,
                "error"
            );

        }

    });


// ========================================
// 9. CHECK EXISTING LOGIN SESSION
// ========================================

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

            showPage("home-page");

        }

    } catch (error) {

        console.error(error);

        showPage("home-page");

    }

}


// ========================================
// 10. LISTEN FOR AUTHENTICATION CHANGES
// ========================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        if (event === "SIGNED_OUT") {

            currentUser = null;

            showPage("home-page");

        }

        if (event === "SIGNED_IN" && session?.user) {

            showDashboard(session.user);

        }

    }
);


// Start the application

checkSession();

/* ========================================
   PHASE 4 — LOST AND FOUND REPORTS
======================================== */


// ========================================
// 1. GET REPORTING ELEMENTS
// ========================================

const lostForm =
    document.getElementById("lost-form");

const foundForm =
    document.getElementById("found-form");

const searchInput =
    document.getElementById("item-search");

const itemFilter =
    document.getElementById("item-filter");

let allSearchItems = [];


// ========================================
// 2. GET CURRENT AUTHENTICATED USER
// ========================================

async function getAuthenticatedUser() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {

        throw new Error(
            "Please log in to continue."
        );

    }

    return data.user;

}


// ========================================
// 3. DASHBOARD NAVIGATION
// ========================================

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


// BACK TO DASHBOARD BUTTONS

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


// ========================================
// 4. SUBMIT LOST ITEM REPORT
// ========================================

lostForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const submitButton =
            lostForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Submitting...";


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


            const { error } =
                await supabaseClient

                    .from("lost_items")

                    .insert(report);


            if (error) {

                throw error;

            }


            lostForm.reset();

            showNotification(
                "Lost item report submitted successfully!"
            );

            showDashboard(user);

        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Lost Report";

        }

    }
);


// ========================================
// 5. SUBMIT FOUND ITEM REPORT
// ========================================

foundForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const submitButton =
            foundForm.querySelector(
                'button[type="submit"]'
            );

        submitButton.disabled = true;

        submitButton.textContent =
            "Submitting...";


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


            const { error } =
                await supabaseClient

                    .from("found_items")

                    .insert(report);


            if (error) {

                throw error;

            }


            foundForm.reset();

            showNotification(
                "Found item report submitted successfully!"
            );

            showDashboard(user);

        } catch (error) {

            console.error(error);

            showNotification(
                error.message,
                "error"
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Found Report";

        }

    }
);


// ========================================
// 6. LOAD LOST AND FOUND ITEMS
// ========================================

async function loadSearchItems() {

    const results =
        document.getElementById(
            "search-results"
        );

    results.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "empty-message";
    loading.textContent = "Loading items...";
    results.appendChild(loading);


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
            lostResult.data.map(function(item) {

                return {
                    ...item,
                    report_type: "lost"
                };

            });


        const foundItems =
            foundResult.data.map(function(item) {

                return {
                    ...item,
                    report_type: "found"
                };

            });


        allSearchItems = [
            ...lostItems,
            ...foundItems
        ];


        allSearchItems.sort(function(a, b) {

            return new Date(b.created_at) -
                   new Date(a.created_at);

        });


        filterSearchItems();

    } catch (error) {

        console.error(error);

        results.replaceChildren();

        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent =
            "Unable to load items: " + error.message;

        results.appendChild(message);

    }

}


// ========================================
// 7. SEARCH AND FILTER ITEMS
// ========================================

function filterSearchItems() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedType =
        itemFilter.value;


    const filteredItems =
        allSearchItems.filter(function(item) {

            const matchesType =
                selectedType === "all" ||
                item.report_type === selectedType;


            const searchText = [

                item.item_name,
                item.category,
                item.color

            ].join(" ").toLowerCase();


            const matchesSearch =
                searchText.includes(searchTerm);


            return matchesType && matchesSearch;

        });


    renderItems(
        filteredItems,
        "search-results"
    );

}


// SEARCH INPUT EVENT

searchInput.addEventListener(
    "input",
    filterSearchItems
);


// FILTER DROPDOWN EVENT

itemFilter.addEventListener(
    "change",
    filterSearchItems
);


// ========================================
// 8. LOAD MY REPORTS
// ========================================

async function loadMyReports() {

    const results =
        document.getElementById(
            "my-reports-results"
        );

    results.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "empty-message";
    loading.textContent = "Loading your reports...";
    results.appendChild(loading);


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
            lostResult.data.map(function(item) {

                return {
                    ...item,
                    report_type: "lost"
                };

            });


        const foundItems =
            foundResult.data.map(function(item) {

                return {
                    ...item,
                    report_type: "found"
                };

            });


        const allReports = [
            ...lostItems,
            ...foundItems
        ];


        allReports.sort(function(a, b) {

            return new Date(b.created_at) -
                   new Date(a.created_at);

        });


        renderItems(
            allReports,
            "my-reports-results"
        );

    } catch (error) {

        console.error(error);

        results.replaceChildren();

        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent =
            "Unable to load reports: " + error.message;

        results.appendChild(message);

    }

}


// ========================================
// 9. CREATE AND DISPLAY ITEM CARDS
// ========================================

function renderItems(items, containerId) {

    const container =
        document.getElementById(containerId);

    container.replaceChildren();


    if (items.length === 0) {

        const message =
            document.createElement("p");

        message.className =
            "empty-message";

        message.textContent =
            "No matching reports found.";

        container.appendChild(message);

        return;

    }


    items.forEach(function(item) {

        const card =
            document.createElement("article");

        card.className = "item-card";


        const badge =
            document.createElement("span");

        badge.className =
            "item-type " + item.report_type;

        badge.textContent =
            item.report_type === "lost"
                ? "LOST ITEM"
                : "FOUND ITEM";

        card.appendChild(badge);


        const title =
            document.createElement("h3");

        title.textContent = item.item_name;

        card.appendChild(title);


        function addDetail(label, value) {

            if (!value) return;

            const paragraph =
                document.createElement("p");

            const labelElement =
                document.createElement("strong");

            labelElement.textContent =
                label + ": ";

            paragraph.appendChild(labelElement);

            paragraph.appendChild(
                document.createTextNode(value)
            );

            card.appendChild(paragraph);

        }


        addDetail("Category", item.category);

        addDetail("Color", item.color);

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


        if (item.description) {

            const description =
                document.createElement("p");

            description.className =
                "item-description";

            description.textContent =
                item.description;

            card.appendChild(description);

        }


        const status =
            document.createElement("p");

        status.className =
            "item-status";

        status.textContent =
            "Status: " +
            item.status.replaceAll("_", " ");

        card.appendChild(status);


        container.appendChild(card);

    });

}
