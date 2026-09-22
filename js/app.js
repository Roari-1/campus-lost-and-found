
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
