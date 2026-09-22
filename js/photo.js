
/* ==========================================
   CAMPUS LOST AND FOUND SYSTEM

   PHASE 7 - PHOTO UPLOADING

   Features:
   - Photo validation
   - Supabase Storage upload
   - Temporary photo URLs
   - Display uploaded photos
========================================== */


// ==========================================
// 1. PHOTO CONFIGURATION
// ==========================================

const PHOTO_BUCKET = "item-photos";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ==========================================
// 2. VALIDATE SELECTED PHOTO
// ==========================================

function validateItemPhoto(file) {

    // Photo uploading is optional.

    if (!file) {

        return;

    }


    // Check file type.

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {

        throw new Error(
            "Please select a JPEG, PNG, or WebP image."
        );

    }


    // Check file size.

    if (file.size > MAX_PHOTO_SIZE) {

        throw new Error(
            "Photo must be 2 MB or smaller."
        );

    }

}


// ==========================================
// 3. UPLOAD PHOTO TO SUPABASE
// ==========================================

async function uploadItemPhoto(
    file,
    userId,
    reportType
) {

    // No photo selected.

    if (!file) {

        return null;

    }


    // Validate file.

    validateItemPhoto(file);


    // Check report type.

    if (
        reportType !== "lost" &&
        reportType !== "found"
    ) {

        throw new Error(
            "Invalid report type."
        );

    }


    // Check authenticated user.

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();


    if (
        userError ||
        !userData.user ||
        userData.user.id !== userId
    ) {

        throw new Error(
            "Please log in to upload a photo."
        );

    }


    // Determine file extension.

    const extension = {

        "image/jpeg": "jpg",

        "image/png": "png",

        "image/webp": "webp"

    }[file.type];


    // Generate a unique filename.

    const uniqueName =
        crypto.randomUUID() + "." + extension;


    // Store photo inside user's folder.

    const filePath =
        userId + "/" +
        reportType + "/" +
        uniqueName;


    // Upload to Supabase Storage.

    const { data, error } =
        await supabaseClient.storage

            .from(PHOTO_BUCKET)

            .upload(

                filePath,

                file,

                {

                    contentType: file.type,

                    upsert: false,

                    cacheControl: "3600"

                }

            );


    if (error) {

        console.error(
            "Photo upload error:",
            error
        );

        throw error;

    }


    // Return the Storage file path.

    return data.path;

}


// ==========================================
// 4. GENERATE TEMPORARY PHOTO URL
// ==========================================

async function getItemPhotoUrl(photoPath) {

    if (!photoPath) {

        return null;

    }


    const { data, error } =
        await supabaseClient.storage

            .from(PHOTO_BUCKET)

            .createSignedUrl(

                photoPath,

                3600

            );


    if (error) {

        console.error(
            "Photo URL error:",
            error
        );

        throw error;

    }


    return data.signedUrl;

}


// ==========================================
// 5. CREATE PHOTO ELEMENT
// ==========================================

async function createItemPhotoElement(photoPath) {

    if (!photoPath) {

        return null;

    }


    try {

        // Generate temporary URL.

        const photoUrl =
            await getItemPhotoUrl(photoPath);


        if (!photoUrl) {

            return null;

        }


        // Create image element.

        const image =
            document.createElement("img");


        image.className = "item-photo";


        image.src = photoUrl;


        image.alt = "Uploaded item photo";


        image.loading = "lazy";


        return image;


    } catch (error) {

        console.error(
            "Unable to display item photo:",
            error
        );

        return null;

    }

}
