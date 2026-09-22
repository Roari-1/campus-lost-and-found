
function showMessage() {
    alert("Welcome to the Campus Lost & Found System!");
}

// Test the Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Supabase connection error:", error.message);
            return;
        }

        console.log("Supabase client initialized successfully!");
        console.log("Current session:", data.session);
    } catch (error) {
        console.error("Connection test failed:", error);
    }
}

testSupabaseConnection();
